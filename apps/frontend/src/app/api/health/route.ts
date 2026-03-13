import { NextResponse } from 'next/server'

/**
 * Health check endpoint
 * Used by Vercel and monitoring services to verify deployment status
 */
export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    // Check if API URL is configured
    if (!apiUrl) {
      return NextResponse.json(
        {
          status: 'degraded',
          timestamp: new Date().toISOString(),
          frontend: 'ok',
          backend: 'not_configured',
          error: 'NEXT_PUBLIC_API_URL not set',
          version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local',
          environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
        },
        { status: 200 }
      )
    }

    // Check backend connection
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

      const response = await fetch(`${apiUrl}/health`, {
        signal: controller.signal,
        next: { revalidate: 0 }, // Don't cache health checks
      })

      clearTimeout(timeoutId)

      const backendStatus = response.ok ? 'connected' : 'unreachable'
      const backendData = response.ok ? await response.json() : null

      return NextResponse.json({
        status: response.ok ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        frontend: 'ok',
        backend: backendStatus,
        backendResponse: backendData,
        version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local',
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
        deployment: {
          url: process.env.VERCEL_URL || 'localhost',
          region: process.env.VERCEL_REGION || 'unknown',
        },
      })
    } catch (fetchError) {
      return NextResponse.json(
        {
          status: 'degraded',
          timestamp: new Date().toISOString(),
          frontend: 'ok',
          backend: 'unreachable',
          error:
            fetchError instanceof Error
              ? fetchError.message
              : 'Failed to connect to backend',
          version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local',
          environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
        },
        { status: 200 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local',
      },
      { status: 500 }
    )
  }
}

// Disable caching for health check endpoint
export const dynamic = 'force-dynamic'
export const revalidate = 0
