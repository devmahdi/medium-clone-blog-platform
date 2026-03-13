import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for protecting admin routes
 * Runs before all requests to /admin/* paths
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    // Check for admin session/token
    const adminToken = request.cookies.get('admin_token')?.value
    const authHeader = request.headers.get('authorization')

    // If no authentication, redirect to login
    if (!adminToken && !authHeader) {
      // Save the requested URL to redirect back after login
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Verify token (this is a basic check - you should validate JWT in production)
    // In production, validate the JWT token against your backend
    if (adminToken) {
      try {
        // TODO: Validate JWT token with backend
        // For now, we'll allow any token (update this in production!)
        
        // Example production validation:
        // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/verify`, {
        //   headers: { Authorization: `Bearer ${adminToken}` }
        // })
        // if (!response.ok) {
        //   return NextResponse.redirect(new URL('/admin/login', request.url))
        // }
      } catch (error) {
        console.error('Token validation error:', error)
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  
  // Security headers for admin routes
  if (pathname.startsWith('/admin')) {
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  }

  return response
}

// Configure which paths this middleware runs on
export const config = {
  matcher: [
    '/admin/:path*',
    // Exclude Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
