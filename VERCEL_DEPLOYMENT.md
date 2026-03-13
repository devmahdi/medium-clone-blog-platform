# Vercel Deployment Guide - Next.js Frontend

Complete guide for deploying the Next.js frontend to Vercel with Railway backend integration.

## 🚀 Quick Start

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository connected
- Railway backend deployed (see backend DEPLOYMENT.md)
- Vercel CLI (optional): `npm install -g vercel`

---

## 📦 1. Create Vercel Project

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..." → "Project"**
3. Import your GitHub repository: `devmahdi/medium-clone-blog-platform`
4. Vercel will automatically detect Next.js

#### Configure Project Settings:

**Framework Preset:** Next.js  
**Root Directory:** `./` (keep monorepo root)  
**Build Command:** `cd apps/frontend && pnpm build`  
**Output Directory:** `apps/frontend/.next`  
**Install Command:** `pnpm install`  

5. Click **"Deploy"** (it will fail first time - that's expected!)

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
cd medium-clone-blog-platform
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: medium-clone-frontend
# - Directory: ./
# - Build command: cd apps/frontend && pnpm build
# - Output directory: apps/frontend/.next
# - Install command: pnpm install
```

---

## 🔧 2. Configure Environment Variables

### Required Environment Variables

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

#### Production Environment

Add the following variables for **Production** environment:

```bash
# Critical: Point to your Railway backend
NEXT_PUBLIC_API_URL=https://your-railway-app.up.railway.app/api/v1

# Environment
NODE_ENV=production
```

#### Preview Environment (Optional)

For PR preview deployments, you can use:

```bash
# Point to staging backend or same production backend
NEXT_PUBLIC_API_URL=https://your-railway-app.up.railway.app/api/v1
NODE_ENV=production
```

#### Development Environment (Local)

These are not needed in Vercel, but for local development:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NODE_ENV=development
```

### Using Vercel CLI to Set Variables

```bash
# Set production variable
vercel env add NEXT_PUBLIC_API_URL production

# Set preview variable
vercel env add NEXT_PUBLIC_API_URL preview

# Set development variable
vercel env add NEXT_PUBLIC_API_URL development

# Pull environment variables locally
vercel env pull
```

---

## 🌐 3. Configure Custom Domain (Optional)

### Add Custom Domain

1. Go to **Settings → Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `blog.yourdomain.com`)
4. Add DNS records as instructed by Vercel:

**For root domain (yourdomain.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For subdomain (blog.yourdomain.com):**
```
Type: CNAME
Name: blog
Value: cname.vercel-dns.com
```

5. Wait for DNS propagation (5-15 minutes)
6. Vercel will automatically provision SSL certificate

### Set Production Domain

Once verified, set as production domain:
- Go to **Settings → Domains**
- Click **"Edit"** on your custom domain
- Select **"Set as Production Domain"**

---

## 📊 4. Enable Vercel Analytics

### Speed Insights

1. Go to **Analytics** tab
2. Enable **"Speed Insights"**
3. No code changes needed - automatically integrated

Features:
- Real User Monitoring (RUM)
- Core Web Vitals tracking
- Performance scores
- Page load metrics

### Web Analytics

1. Go to **Analytics** tab
2. Enable **"Web Analytics"**
3. Track visitor metrics:
   - Page views
   - Unique visitors
   - Top pages
   - Referrer sources

---

## ⚙️ 5. Optimize Build Settings

### Incremental Static Regeneration (ISR)

Update `apps/frontend/next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  // ... existing config
  
  // Enable ISR for blog posts
  experimental: {
    // Revalidate static pages every 60 seconds
    isrMemoryCacheSize: 50, // MB
  },
}
```

### Edge Functions (Optional)

For API routes that need global distribution:

```typescript
// apps/frontend/src/app/api/example/route.ts
export const runtime = 'edge'

export async function GET(request: Request) {
  // This runs on Vercel Edge Network
  return new Response('Hello from Edge!')
}
```

### Image Optimization

Already configured in `next.config.ts`:

```typescript
images: {
  formats: ['image/avif', 'image/webp'],
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'your-railway-app.up.railway.app', // Backend image URLs
    },
  ],
}
```

### Output File Tracing

Next.js 16 automatically optimizes bundle size with:
- Tree shaking
- Code splitting
- Image optimization
- Font optimization

---

## 🔄 6. Automatic Deployments

### Configure Git Integration

Vercel automatically deploys on:
- ✅ Every push to `main` branch (production)
- ✅ Every pull request (preview deployment)

### Deployment Workflow

1. **Push to `main`:**
   ```bash
   git add .
   git commit -m "Update frontend"
   git push origin main
   ```
   → Triggers production deployment

2. **Create PR:**
   ```bash
   git checkout -b feature/new-feature
   git push origin feature/new-feature
   ```
   → Creates PR with preview deployment

3. **Merge PR:**
   → Automatically deploys to production

### Deployment Notifications

Enable notifications in **Settings → Git**:
- GitHub commit status checks
- Pull request comments
- Deployment status updates

---

## 🩺 7. Health Check & Monitoring

### Built-in Monitoring

Vercel provides:
- **Real-time logs** - View deployment and function logs
- **Analytics** - Page views, performance metrics
- **Error tracking** - Runtime errors and stack traces
- **Uptime monitoring** - 99.99% SLA

### Custom Health Check

Create a health check route:

```typescript
// apps/frontend/src/app/api/health/route.ts
export async function GET() {
  try {
    // Check backend connection
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/health`,
      { next: { revalidate: 0 } }
    )
    
    const backendStatus = response.ok ? 'connected' : 'disconnected'
    
    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      backend: backendStatus,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local',
    })
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
```

Access at: `https://yourdomain.com/api/health`

---

## 🚨 8. Error Tracking & Debugging

### View Logs

**Via Dashboard:**
1. Go to **Deployments**
2. Click on a deployment
3. View **"Build Logs"** or **"Function Logs"**

**Via CLI:**
```bash
# View logs for latest deployment
vercel logs

# Follow logs in real-time
vercel logs --follow

# Filter by deployment
vercel logs [deployment-url]
```

### Runtime Errors

Vercel captures:
- Unhandled exceptions
- API route errors
- Edge function errors

View in **Functions** tab on deployment details.

### Debug Mode

Enable debug mode locally:

```bash
# .env.local
NEXT_PUBLIC_DEBUG=true

# Then check browser console for detailed logs
```

---

## 🔐 9. Security Best Practices

### Environment Variables

- ✅ Never commit `.env.local` or `.env.production`
- ✅ Use Vercel dashboard for secrets
- ✅ Prefix browser variables with `NEXT_PUBLIC_`
- ✅ Keep API keys server-side only

### Security Headers

Already configured in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### CORS Configuration

Ensure backend CORS allows Vercel domains:

```bash
# In Railway backend environment
CORS_ORIGINS=https://yourdomain.com,https://vercel-preview-*.vercel.app
```

---

## 📈 10. Performance Optimization

### Bundle Analysis

Analyze bundle size:

```bash
# Install analyzer
pnpm add -D @next/bundle-analyzer

# Update next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

# Run analysis
ANALYZE=true pnpm build
```

### Caching Strategy

Next.js automatically caches:
- Static pages (forever)
- ISR pages (per revalidation period)
- API responses (configurable)

Configure cache headers:

```typescript
// In API routes or Server Components
export const revalidate = 60 // Revalidate every 60 seconds
export const dynamic = 'force-static' // Or 'force-dynamic'
```

### Font Optimization

Use `next/font`:

```typescript
// apps/frontend/src/app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

---

## 🔄 11. Rollback & Version Control

### Rollback to Previous Deployment

**Via Dashboard:**
1. Go to **Deployments**
2. Find a previous successful deployment
3. Click **"..."** → **"Promote to Production"**

**Via CLI:**
```bash
# List deployments
vercel ls

# Promote a specific deployment to production
vercel promote [deployment-url]

# Or alias a deployment
vercel alias [deployment-url] yourdomain.com
```

### Instant Rollback

Vercel keeps all deployments immutable:
- No build required for rollback
- Instant switch (< 1 second)
- Zero downtime

---

## 🐛 12. Troubleshooting

### Build Fails

**Issue:** `pnpm: command not found`

**Fix:**
1. Go to **Settings → General**
2. Check **"Node.js Version"** is 20.x or higher
3. Ensure **"Install Command"** is `pnpm install`
4. Vercel auto-detects pnpm from `package.json`

---

### API Connection Fails

**Issue:** Frontend can't connect to backend

**Fix:**
```bash
# 1. Check environment variable is set
vercel env ls

# 2. Verify backend URL is correct
echo $NEXT_PUBLIC_API_URL

# 3. Test backend health
curl https://your-railway-app.up.railway.app/api/v1/health

# 4. Check CORS in backend allows Vercel domain
# In Railway: CORS_ORIGINS should include yourdomain.com
```

---

### Preview Deployment Issues

**Issue:** PR preview deployments fail

**Fix:**
1. Check **Settings → Git → Ignored Build Step**
2. Ensure it's not ignoring all PRs
3. Verify GitHub integration is active

---

### Environment Variables Not Working

**Issue:** `NEXT_PUBLIC_API_URL` is undefined

**Fix:**
1. Variables must be prefixed with `NEXT_PUBLIC_` to work in browser
2. Redeploy after adding env vars (existing deployments don't auto-update)
3. Check variable is set for correct environment (Production/Preview/Development)

---

## 💰 13. Cost & Usage

### Vercel Pricing Tiers

| Tier | Price | Included |
|------|-------|----------|
| **Hobby** | Free | 100GB bandwidth, 100 deployments/day |
| **Pro** | $20/month | 1TB bandwidth, unlimited deployments |
| **Enterprise** | Custom | Custom limits, SLA, support |

### Optimize Costs

- Use ISR to reduce build frequency
- Optimize images (WebP/AVIF)
- Enable caching where possible
- Use Edge Functions sparingly (counted separately)

### Monitor Usage

Check **Settings → Usage**:
- Bandwidth used
- Build minutes
- Edge function invocations
- Serverless function GB-hours

---

## 🌍 14. Multi-Region Deployment

### Edge Network

Vercel automatically deploys to their global Edge Network:
- 40+ global regions
- Automatic routing to nearest region
- Sub-100ms response times globally

### Configure Regions

In `vercel.json`:

```json
{
  "regions": ["iad1", "sfo1", "cdg1"]
}
```

Available regions: https://vercel.com/docs/edge-network/regions

---

## 📊 15. Analytics Integration

### Google Analytics

```typescript
// apps/frontend/src/app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### PostHog (Alternative)

```bash
pnpm add posthog-js

# Then wrap app with PostHogProvider
```

---

## 🔗 16. Connect to Railway Backend

### Update Backend CORS

In Railway backend, set:

```bash
# Production domain
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Include preview deployments
CORS_ORIGINS=https://yourdomain.com,https://*.vercel.app
```

### Test Connection

```typescript
// apps/frontend/src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function testConnection() {
  try {
    const response = await fetch(`${API_URL}/health`)
    const data = await response.json()
    console.log('Backend connected:', data)
    return data
  } catch (error) {
    console.error('Backend connection failed:', error)
    throw error
  }
}
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [x] Vercel account created
- [x] GitHub repository connected
- [x] Railway backend deployed
- [x] Backend URL obtained
- [x] vercel.json configured
- [x] Environment variables template created

### Deployment
- [ ] Create Vercel project
- [ ] Configure build settings (monorepo)
- [ ] Set environment variables
- [ ] Deploy to production
- [ ] Verify deployment success
- [ ] Test API connectivity

### Post-Deployment
- [ ] Configure custom domain
- [ ] Enable Vercel Analytics
- [ ] Enable Speed Insights
- [ ] Update backend CORS
- [ ] Test health check endpoint
- [ ] Verify preview deployments work
- [ ] Document deployment URL

### Optional Enhancements
- [ ] Set up error tracking (Sentry)
- [ ] Configure bundle analyzer
- [ ] Add Google Analytics
- [ ] Set up monitoring alerts
- [ ] Enable ISR for blog posts
- [ ] Optimize images
- [ ] Add E2E tests in CI/CD

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Edge Functions](https://vercel.com/docs/functions/edge-functions)
- [Incremental Static Regeneration](https://vercel.com/docs/incremental-static-regeneration)

---

## 🎉 Success Criteria

Your frontend is successfully deployed when:

- ✅ Production URL loads without errors
- ✅ API calls to Railway backend work
- ✅ Images load and optimize correctly
- ✅ Custom domain (if configured) resolves
- ✅ SSL certificate is active
- ✅ Preview deployments work for PRs
- ✅ Analytics tracking is active
- ✅ Performance scores are good (Lighthouse 90+)

---

**🚀 Your Next.js frontend is now live on Vercel!**

Access your app at:
- **Production:** `https://yourdomain.com` (or `https://your-app.vercel.app`)
- **Preview:** Automatically created for each PR
- **Health Check:** `https://yourdomain.com/api/health`
