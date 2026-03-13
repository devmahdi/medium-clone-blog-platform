import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Vercel Analytics & Speed Insights (automatically enabled)
  // No additional configuration needed
  
  // Enable experimental features
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
    // Turbopack for faster builds (Next.js 16+)
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Image optimization for Vercel
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS images
      },
      {
        protocol: 'http',
        hostname: 'localhost', // Allow localhost images in development
        port: '3001',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // Cache images for 60 seconds
  },

  // Security headers (also configured in vercel.json)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // Redirects for SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },

  // Environment variables available in browser
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  },

  // Output configuration for Vercel
  output: 'standalone', // Optimized for serverless deployment

  // Webpack configuration for advanced optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Replace React with Preact in production for smaller bundle
      // Uncomment if you want to use Preact (optional)
      // Object.assign(config.resolve.alias, {
      //   'react/jsx-runtime.js': 'preact/compat/jsx-runtime',
      //   react: 'preact/compat',
      //   'react-dom/test-utils': 'preact/test-utils',
      //   'react-dom': 'preact/compat',
      // })
    }

    return config
  },

  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Type checking during build
  typescript: {
    // Don't fail build on type errors (set to true in CI/CD)
    ignoreBuildErrors: false,
  },

  // ESLint during build
  eslint: {
    // Don't fail build on lint errors (set to true in CI/CD)
    ignoreDuringBuilds: false,
  },

  // Trailing slash configuration
  trailingSlash: false,

  // Compression (Vercel handles this automatically)
  compress: true,

  // Production source maps (disable for smaller builds)
  productionBrowserSourceMaps: false,

  // Internationalization (if needed)
  // i18n: {
  //   locales: ['en', 'es', 'fr'],
  //   defaultLocale: 'en',
  // },
}

export default nextConfig
