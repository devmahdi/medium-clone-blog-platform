# 🔧 Vercel Deployment Troubleshooting

Common issues and solutions when deploying Next.js frontend to Vercel.

---

## Build Errors

### ❌ "Command failed: cd apps/frontend && pnpm build"

**Cause:** Monorepo build command issue.

**Solution:**
1. Go to Vercel Dashboard → Settings → General
2. Update **Build Command:**
   ```bash
   cd apps/frontend && pnpm build
   ```
3. Update **Output Directory:**
   ```
   apps/frontend/.next
   ```
4. Update **Install Command:**
   ```
   pnpm install
   ```

---

### ❌ "pnpm: command not found"

**Cause:** Vercel didn't detect pnpm.

**Solution:**
Ensure root `package.json` has:
```json
{
  "packageManager": "pnpm@9.15.4",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

If still failing, update Install Command:
```bash
npm install -g pnpm && pnpm install
```

---

### ❌ "Module not found" during build

**Cause:** Dependencies missing or wrong path.

**Solution:**
```bash
# Local test
cd apps/frontend
pnpm install
pnpm build

# Check if build works locally
# If yes, ensure Vercel uses same Node version
```

In Vercel → Settings → General → Node.js Version: **20.x**

---

## Environment Variable Issues

### ❌ "NEXT_PUBLIC_API_URL is undefined"

**Cause:** Environment variable not set or not prefixed correctly.

**Solution:**
1. Variable MUST start with `NEXT_PUBLIC_` to work in browser
2. Add in Vercel Dashboard → Settings → Environment Variables
3. Redeploy (env vars don't apply to existing deployments)

```bash
# Verify variable is set
vercel env ls

# Pull locally to test
vercel env pull .env.local
```

---

### ❌ Environment variable works in development but not production

**Cause:** Different environment variable scopes.

**Solution:**
When adding env vars in Vercel, select correct environments:
- ✅ Production
- ✅ Preview
- ✅ Development

Or use Vercel CLI:
```bash
# Set for all environments
vercel env add NEXT_PUBLIC_API_URL

# Set for specific environment
vercel env add NEXT_PUBLIC_API_URL production
```

---

## API Connection Errors

### ❌ "Failed to fetch" or "Network request failed"

**Cause:** Can't connect to Railway backend.

**Solution:**
1. **Check API URL is correct:**
   ```bash
   # In browser console:
   console.log(process.env.NEXT_PUBLIC_API_URL)
   ```

2. **Test backend directly:**
   ```bash
   curl https://your-railway-app.up.railway.app/api/v1/health
   ```

3. **Check backend CORS allows Vercel:**
   ```bash
   # In Railway, ensure CORS_ORIGINS includes:
   CORS_ORIGINS=https://yourdomain.com,https://*.vercel.app
   ```

---

### ❌ CORS error: "Access-Control-Allow-Origin"

**Cause:** Backend not allowing Vercel domain.

**Solution:**
Update Railway backend CORS:

```bash
# Include your Vercel domain
railway variables set CORS_ORIGINS="https://your-app.vercel.app,https://yourdomain.com"

# For preview deployments, use wildcard:
railway variables set CORS_ORIGINS="https://*.vercel.app,https://yourdomain.com"
```

Restart backend after updating CORS.

---

## Deployment Issues

### ❌ "Deployment failed: Application error"

**Cause:** Runtime error in Next.js app.

**Solution:**
1. Check Function Logs:
   - Go to deployment
   - Click **"Functions"** tab
   - View error logs

2. Common causes:
   - Missing environment variable
   - API route error
   - Server component error

3. Test locally:
   ```bash
   pnpm build
   pnpm start
   # Visit localhost:3000 and check console
   ```

---

### ❌ "Build succeeded but site shows 404"

**Cause:** Output directory misconfigured.

**Solution:**
Verify in Vercel → Settings → General:
- **Output Directory:** `apps/frontend/.next`
- **Build Command:** `cd apps/frontend && pnpm build`

For monorepo, directory MUST be relative to repo root.

---

### ❌ Build times out (>45 minutes)

**Cause:** Build is taking too long.

**Solution:**
1. Reduce dependencies
2. Enable caching:
   ```typescript
   // next.config.ts
   const nextConfig = {
     experimental: {
       turbotrace: {
         logAll: false,
       },
     },
   }
   ```
3. Upgrade to Pro plan (longer build timeout)

---

## Performance Issues

### ❌ Images load slowly

**Cause:** Not using Next.js Image component.

**Solution:**
Use `next/image`:
```typescript
import Image from 'next/image'

<Image
  src="/photo.jpg"
  width={500}
  height={300}
  alt="Photo"
  priority  // For above-the-fold images
/>
```

Configure domains in `next.config.ts`:
```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'your-railway-app.up.railway.app',
    },
  ],
}
```

---

### ❌ Slow page loads

**Cause:** Not using Server Components or ISR.

**Solution:**
1. Use Server Components (default in App Router):
   ```typescript
   // app/posts/page.tsx
   export default async function PostsPage() {
     const posts = await fetch('...')
     return <PostsList posts={posts} />
   }
   ```

2. Enable ISR:
   ```typescript
   // Revalidate every 60 seconds
   export const revalidate = 60
   ```

---

## Custom Domain Issues

### ❌ "Domain not reachable"

**Cause:** DNS not configured or propagating.

**Solution:**
1. Verify DNS records:
   ```bash
   # Check A record
   dig yourdomain.com

   # Check CNAME
   dig blog.yourdomain.com
   ```

2. Correct DNS configuration:
   - **A Record:** `76.76.21.21` (for root domain)
   - **CNAME:** `cname.vercel-dns.com` (for subdomain)

3. Wait 5-60 minutes for propagation

4. Use [DNS Checker](https://dnschecker.org) to verify

---

### ❌ "SSL certificate pending"

**Cause:** DNS not fully propagated or CAA record blocking.

**Solution:**
1. Wait 10-15 minutes after DNS propagation
2. Check CAA records allow Let's Encrypt:
   ```bash
   dig CAA yourdomain.com
   ```

3. If CAA exists, ensure it includes:
   ```
   yourdomain.com. CAA 0 issue "letsencrypt.org"
   ```

4. Remove Cloudflare proxy if using (set to DNS only)

---

## Preview Deployment Issues

### ❌ PR deployments not creating

**Cause:** GitHub integration not configured.

**Solution:**
1. Go to Settings → Git
2. Ensure **"Automatic Preview Deployments"** is ON
3. Check **"Ignored Build Step"** is not blocking PRs
4. Verify GitHub App permissions

---

### ❌ Preview shows old code

**Cause:** Cached build.

**Solution:**
```bash
# Force new deployment
vercel --force

# Or in PR:
# Close and reopen PR to trigger new build
```

---

## Analytics Issues

### ❌ Vercel Analytics not showing data

**Cause:** Not enabled or not enough traffic.

**Solution:**
1. Go to Analytics tab
2. Click **"Enable Speed Insights"**
3. Wait 24 hours for data to populate
4. Requires at least 10 page views

---

### ❌ Web Analytics showing 0 visitors

**Cause:** Ad blockers or privacy extensions.

**Solution:**
- Vercel Analytics respects Do Not Track
- Test in incognito mode
- Some users will be blocked by ad blockers

---

## Rollback Issues

### ❌ Need to rollback but deployment is broken

**Solution:**
Vercel keeps all deployments immutable:

1. **Via Dashboard:**
   - Deployments → Find last working deployment
   - Click **"..."** → **"Promote to Production"**

2. **Via CLI:**
   ```bash
   vercel ls
   vercel promote <deployment-url>
   ```

Rollback is instant (< 1 second).

---

## GitHub Actions Issues

### ❌ "VERCEL_TOKEN not found"

**Cause:** Missing GitHub secret.

**Solution:**
1. Generate Vercel token:
   ```bash
   vercel login
   # Go to https://vercel.com/account/tokens
   # Create new token
   ```

2. Add to GitHub:
   - Repo → Settings → Secrets and variables → Actions
   - New secret: `VERCEL_TOKEN`

---

### ❌ "VERCEL_ORG_ID not found"

**Cause:** Missing organization ID.

**Solution:**
```bash
# Get org ID from .vercel/project.json
vercel link

# Add to GitHub secrets:
# VERCEL_ORG_ID (from .vercel/project.json)
# VERCEL_PROJECT_ID (from .vercel/project.json)
```

---

## Common Commands for Debugging

```bash
# Deploy manually
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs [deployment-url]

# Pull environment variables
vercel env pull

# List deployments
vercel ls

# Inspect deployment
vercel inspect [deployment-url]

# Check project settings
vercel project

# Link to project
vercel link

# Remove deployment
vercel remove [deployment-name] --yes

# Cancel deployment
vercel cancel [deployment-url]
```

---

## Still Having Issues?

1. **Check Vercel Status:** [status.vercel.com](https://status.vercel.com)
2. **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
3. **Vercel Discord:** [vercel.com/discord](https://vercel.com/discord)
4. **GitHub Issues:** Create issue in this repo

---

## Useful Vercel CLI Commands

```bash
# Project management
vercel login          # Login to Vercel
vercel logout         # Logout
vercel whoami         # Check current user
vercel link           # Link local directory to project
vercel unlink         # Unlink project

# Deployment
vercel                # Deploy to preview
vercel --prod         # Deploy to production
vercel --force        # Force new build (skip cache)

# Environment
vercel env ls         # List environment variables
vercel env add        # Add new variable
vercel env rm         # Remove variable
vercel env pull       # Download variables locally

# Projects
vercel projects ls    # List all projects
vercel project        # View project details

# Domains
vercel domains ls     # List domains
vercel domains add    # Add domain
vercel domains rm     # Remove domain

# Monitoring
vercel logs           # View function logs
vercel inspect        # Inspect deployment
vercel ls             # List deployments

# Aliases
vercel alias          # Manage aliases
vercel promote        # Promote deployment to production

# Certificates
vercel certs ls       # List SSL certificates
vercel certs issue    # Issue new certificate
```

---

**🔍 Pro Tip:** Most issues can be debugged with `vercel logs --follow`
