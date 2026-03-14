# 🔐 Production Environment Variables - Complete Configuration Guide

**Complete step-by-step guide for configuring all environment variables across Railway, Vercel, and GitHub.**

---

## 📋 Quick Reference

| Platform | Variables | Status | Documentation |
|----------|-----------|--------|---------------|
| **Railway (Backend)** | 15 required | ⚠️ Needs setup | See Section 1 |
| **Vercel (Frontend)** | 2 required | ⚠️ Needs setup | See Section 2 |
| **GitHub Actions** | 5 required | ⚠️ Needs setup | See Section 3 |

---

## 1️⃣ Railway (Backend) Environment Variables

### Auto-Generated Secrets

First, generate secure secrets for JWT authentication:

```bash
# Generate JWT_SECRET (32 bytes, base64)
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET (32 bytes, base64)
openssl rand -base64 32
```

**Copy these outputs - you'll need them in the next step!**

### Set Variables via Railway CLI

```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your backend project
cd backend
railway link

# Set production environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set API_PREFIX=api/v1

# Database settings (Railway auto-provides DB connection, these are additional settings)
railway variables set DB_SYNC=false
railway variables set DB_LOGGING=false

# JWT secrets (REPLACE WITH YOUR GENERATED SECRETS!)
railway variables set JWT_SECRET="<paste-jwt-secret-here>"
railway variables set JWT_EXPIRATION="15m"
railway variables set JWT_REFRESH_SECRET="<paste-jwt-refresh-secret-here>"
railway variables set JWT_REFRESH_EXPIRATION="7d"

# CORS (UPDATE WITH YOUR ACTUAL VERCEL URL!)
railway variables set CORS_ORIGINS="https://your-app.vercel.app,https://*.vercel.app"

# Rate limiting
railway variables set THROTTLE_TTL=60
railway variables set THROTTLE_LIMIT=100

# Storage settings
railway variables set STORAGE_PROVIDER=local
railway variables set MAX_FILE_SIZE=5242880
railway variables set UPLOAD_DIR=./uploads

# Pagination
railway variables set DEFAULT_PAGE_SIZE=20
railway variables set MAX_PAGE_SIZE=100

# Logging
railway variables set LOG_LEVEL=info

# Redis settings (if using Redis - add Redis service first)
railway variables set REDIS_TTL=3600
```

### Set Variables via Railway Dashboard

Alternatively, use the Railway web dashboard:

1. **Go to:** [Railway Dashboard](https://railway.app/dashboard)
2. **Select your backend project**
3. **Click:** Variables tab
4. **Click:** "Add Variable" for each:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `3000` | Or leave as Railway default |
| `API_PREFIX` | `api/v1` | API route prefix |
| `DB_SYNC` | `false` | ⚠️ NEVER true in production! |
| `DB_LOGGING` | `false` | Set to `true` for debugging |
| `JWT_SECRET` | `<generated-secret>` | ⚠️ Use openssl rand -base64 32 |
| `JWT_EXPIRATION` | `15m` | Access token expiration |
| `JWT_REFRESH_SECRET` | `<generated-secret>` | ⚠️ Use openssl rand -base64 32 |
| `JWT_REFRESH_EXPIRATION` | `7d` | Refresh token expiration |
| `CORS_ORIGINS` | `https://your-app.vercel.app,https://*.vercel.app` | ⚠️ Update with actual domains |
| `THROTTLE_TTL` | `60` | Rate limit time window (seconds) |
| `THROTTLE_LIMIT` | `100` | Max requests per TTL |
| `STORAGE_PROVIDER` | `local` | Or `s3` if using AWS |
| `MAX_FILE_SIZE` | `5242880` | 5MB in bytes |
| `UPLOAD_DIR` | `./uploads` | Local storage directory |
| `DEFAULT_PAGE_SIZE` | `20` | Pagination default |
| `MAX_PAGE_SIZE` | `100` | Pagination max |
| `LOG_LEVEL` | `info` | `error`, `warn`, `info`, `debug` |

### Database Variables (Auto-Provided by Railway)

Railway automatically sets these when you add a PostgreSQL database:

- `DATABASE_URL` - Full connection string
- `PGHOST` - Database host
- `PGPORT` - Database port
- `PGUSER` - Database user
- `PGPASSWORD` - Database password
- `PGDATABASE` - Database name

**No action needed - Railway handles these automatically!**

### Redis Variables (Optional)

If you add Redis service to Railway:

```bash
railway add --database redis
railway variables set REDIS_TTL=3600
```

Railway will auto-inject:
- `REDIS_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`

### AWS S3 Variables (Optional)

If using S3 for file storage:

```bash
railway variables set STORAGE_PROVIDER=s3
railway variables set AWS_ACCESS_KEY_ID="<your-access-key>"
railway variables set AWS_SECRET_ACCESS_KEY="<your-secret-key>"
railway variables set AWS_REGION="us-east-1"
railway variables set AWS_S3_BUCKET="medium-clone-uploads"
```

### Verify Railway Variables

```bash
# List all variables
railway variables

# Check specific variable
railway variables get JWT_SECRET
```

---

## 2️⃣ Vercel (Frontend) Environment Variables

### Set Variables via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Link to your frontend project
cd medium-clone-blog-platform
vercel link

# Get your Railway backend URL first!
# Option 1: From Railway CLI
railway status

# Option 2: From Railway dashboard
# Go to your backend project → Copy the deployment URL

# Set frontend environment variables (REPLACE <railway-url> WITH ACTUAL URL!)
vercel env add NEXT_PUBLIC_API_URL production

# When prompted, enter:
# https://<your-railway-app>.up.railway.app/api/v1

# Set NODE_ENV
vercel env add NODE_ENV production
# When prompted, enter: production
```

### Set Variables via Vercel Dashboard

1. **Go to:** [Vercel Dashboard](https://vercel.com/dashboard)
2. **Select your frontend project**
3. **Click:** Settings → Environment Variables
4. **Add variables:**

| Variable | Value | Environments |
|----------|-------|--------------|
| `NEXT_PUBLIC_API_URL` | `https://your-railway-app.up.railway.app/api/v1` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

**⚠️ Critical:**
- Replace `your-railway-app` with your **actual Railway backend URL**
- Include `/api/v1` at the end
- Select all environments (Production, Preview, Development)

### Get Your Railway Backend URL

```bash
# Method 1: Railway CLI
railway status
# Look for "Service URL"

# Method 2: Railway dashboard
# Go to backend project → Click "View Logs" → URL shown at top

# Method 3: Deploy and check
railway up
# URL will be shown after deployment
```

**Example URL format:**
```
https://medium-clone-backend-production.up.railway.app/api/v1
```

### Verify Vercel Variables

```bash
# List all environment variables
vercel env ls

# Pull variables locally for testing
vercel env pull .env.local
```

---

## 3️⃣ GitHub Actions Secrets

### Required Secrets

| Secret | Used By | How to Get |
|--------|---------|------------|
| `RAILWAY_TOKEN` | Backend workflow | `railway tokens` |
| `VERCEL_TOKEN` | Frontend workflow | Vercel → Account → Tokens |
| `VERCEL_ORG_ID` | Frontend workflow | `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Frontend workflow | `.vercel/project.json` |
| `SLACK_WEBHOOK_URL` | Both workflows (optional) | Slack → Apps → Incoming Webhooks |

### Backend Repository Secrets

**Repository:** `devmahdi/backend`

```bash
# 1. Get Railway token
railway tokens
# Copy the token that's generated

# 2. Add to GitHub
# Go to: https://github.com/devmahdi/backend/settings/secrets/actions
# Click: "New repository secret"

# Secret 1: RAILWAY_TOKEN
# Name: RAILWAY_TOKEN
# Value: <paste-railway-token>

# Secret 2: SLACK_WEBHOOK_URL (optional)
# Name: SLACK_WEBHOOK_URL
# Value: <paste-slack-webhook-url>
```

### Frontend Repository Secrets

**Repository:** `devmahdi/medium-clone-blog-platform`

```bash
# 1. Get Vercel token
# Go to: https://vercel.com/account/tokens
# Create token → Copy it

# 2. Get Vercel IDs
cd medium-clone-blog-platform
vercel link
cat .vercel/project.json

# You'll see:
# {
#   "orgId": "team_XXXXXXXXXX",
#   "projectId": "prj_XXXXXXXXXX"
# }

# 3. Get Railway backend URL
railway status  # In backend directory
# Or from Railway dashboard

# 4. Add to GitHub
# Go to: https://github.com/devmahdi/medium-clone-blog-platform/settings/secrets/actions
# Click: "New repository secret"

# Secret 1: VERCEL_TOKEN
# Name: VERCEL_TOKEN
# Value: <paste-vercel-token>

# Secret 2: VERCEL_ORG_ID
# Name: VERCEL_ORG_ID
# Value: <paste-orgId-from-project.json>

# Secret 3: VERCEL_PROJECT_ID
# Name: VERCEL_PROJECT_ID
# Value: <paste-projectId-from-project.json>

# Secret 4: NEXT_PUBLIC_API_URL
# Name: NEXT_PUBLIC_API_URL
# Value: https://your-railway-app.up.railway.app/api/v1

# Secret 5: SLACK_WEBHOOK_URL (optional)
# Name: SLACK_WEBHOOK_URL
# Value: <paste-slack-webhook-url>
```

---

## 4️⃣ Verification Checklist

### Backend (Railway)

```bash
# Check variables are set
railway variables

# Expected output should include:
# ✅ NODE_ENV=production
# ✅ JWT_SECRET=<secret>
# ✅ JWT_REFRESH_SECRET=<secret>
# ✅ CORS_ORIGINS=https://*.vercel.app
# ✅ DATABASE_URL=postgresql://...
# ✅ And all other variables

# Test deployment
railway up

# Check health endpoint
curl https://your-railway-app.up.railway.app/api/v1/health

# Should return:
# {
#   "status": "ok",
#   "timestamp": "...",
#   "database": "connected"
# }
```

### Frontend (Vercel)

```bash
# Check variables are set
vercel env ls

# Expected output should include:
# ✅ NEXT_PUBLIC_API_URL (Production, Preview, Development)
# ✅ NODE_ENV (Production)

# Test deployment
vercel --prod

# Check health endpoint
curl https://your-vercel-app.vercel.app/api/health

# Should return:
# {
#   "status": "ok",
#   "frontend": "ok",
#   "backend": "connected"
# }
```

### GitHub Actions

```bash
# Check secrets are set
# Go to repository Settings → Secrets and variables → Actions

# Backend should have:
# ✅ RAILWAY_TOKEN
# ✅ SLACK_WEBHOOK_URL (optional)

# Frontend should have:
# ✅ VERCEL_TOKEN
# ✅ VERCEL_ORG_ID
# ✅ VERCEL_PROJECT_ID
# ✅ NEXT_PUBLIC_API_URL
# ✅ SLACK_WEBHOOK_URL (optional)

# Test workflow
# Push a commit to main and watch GitHub Actions
```

---

## 5️⃣ Update CORS After Deployment

### Get Vercel URL

After deploying frontend to Vercel, get the production URL:

```bash
vercel ls
# Or check Vercel dashboard
```

### Update Railway CORS

```bash
# Update CORS to include your actual Vercel domain
railway variables set CORS_ORIGINS="https://your-actual-app.vercel.app,https://*.vercel.app,https://yourdomain.com"

# Restart backend
railway up
```

### Test CORS

```bash
# From browser console on your Vercel frontend:
fetch('https://your-railway-app.up.railway.app/api/v1/health')
  .then(r => r.json())
  .then(console.log)

# Should work without CORS errors
```

---

## 6️⃣ Environment-Specific Values

### Development

```bash
# Backend (.env)
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/medium
JWT_SECRET=dev-secret-not-for-production
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Staging (Optional)

```bash
# Backend (Railway staging environment)
NODE_ENV=staging
CORS_ORIGINS=https://staging-app.vercel.app,https://*.vercel.app

# Frontend (Vercel preview)
NEXT_PUBLIC_API_URL=https://staging-backend.up.railway.app/api/v1
```

### Production

```bash
# Backend (Railway production)
NODE_ENV=production
CORS_ORIGINS=https://yourdomain.com,https://*.vercel.app
DB_SYNC=false
DB_LOGGING=false
LOG_LEVEL=warn

# Frontend (Vercel production)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NODE_ENV=production
```

---

## 7️⃣ Custom Domain Configuration

### Backend Custom Domain (Railway)

1. **Go to:** Railway Dashboard → Your backend project
2. **Click:** Settings → Networking
3. **Add domain:** `api.yourdomain.com`
4. **Add DNS record:**
   ```
   Type: CNAME
   Name: api
   Value: <railway-provided-url>
   ```

5. **Update Vercel frontend:**
   ```bash
   vercel env rm NEXT_PUBLIC_API_URL production
   vercel env add NEXT_PUBLIC_API_URL production
   # Enter: https://api.yourdomain.com/api/v1
   ```

### Frontend Custom Domain (Vercel)

1. **Go to:** Vercel Dashboard → Your frontend project
2. **Click:** Settings → Domains
3. **Add domain:** `yourdomain.com`
4. **Add DNS record:**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

5. **Update Railway backend:**
   ```bash
   railway variables set CORS_ORIGINS="https://yourdomain.com,https://*.vercel.app"
   ```

---

## 8️⃣ Security Best Practices

### JWT Secrets

- ✅ Use `openssl rand -base64 32` to generate
- ✅ Different secrets for access and refresh tokens
- ✅ Never commit to git
- ✅ Rotate periodically (every 90 days recommended)
- ❌ Never use default/example values in production

### CORS

- ✅ Specify exact domains: `https://yourdomain.com`
- ✅ Use wildcards carefully: `https://*.vercel.app` (for preview deploys)
- ❌ Never use `*` (allow all) in production
- ❌ Don't include `http://` domains in production

### Database

- ✅ `DB_SYNC=false` in production (prevents auto-schema changes)
- ✅ Use migrations for schema changes
- ✅ Enable SSL connections in production
- ❌ Never log database credentials

### Environment Variables

- ✅ Use platform-specific secret management (Railway, Vercel)
- ✅ Different values for dev/staging/production
- ✅ Document in `.env.example` files
- ❌ Never commit `.env` files to git
- ❌ Never expose secrets in client-side code

---

## 9️⃣ Troubleshooting

### Backend: "CORS error"

**Problem:** Frontend can't connect to backend

**Fix:**
```bash
# Check CORS_ORIGINS includes your frontend domain
railway variables get CORS_ORIGINS

# Should include:
# https://your-vercel-app.vercel.app
# https://*.vercel.app (for preview deploys)

# Update if needed:
railway variables set CORS_ORIGINS="https://your-app.vercel.app,https://*.vercel.app"
railway up  # Restart
```

### Frontend: "API_URL is undefined"

**Problem:** `NEXT_PUBLIC_API_URL` not set

**Fix:**
```bash
# Check variable is set
vercel env ls

# If missing, add it:
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://your-railway-app.up.railway.app/api/v1

# Redeploy:
vercel --prod
```

### GitHub Actions: "RAILWAY_TOKEN not found"

**Problem:** Secret not configured

**Fix:**
1. Get token: `railway tokens`
2. Add to GitHub: Repo → Settings → Secrets → Actions
3. Add secret: `RAILWAY_TOKEN` with the generated token

### Database: "Connection refused"

**Problem:** Database not provisioned or variables not set

**Fix:**
```bash
# Check if PostgreSQL is added
railway services

# If not, add it:
railway add --database postgresql

# Railway will auto-inject DATABASE_URL
```

---

## 🔟 Complete Setup Script

Here's a complete script to set up all environment variables:

```bash
#!/bin/bash

# Complete Environment Setup Script
# Run this after deploying to Railway and Vercel

echo "🔐 Setting up environment variables..."

# ============================================
# 1. Generate JWT secrets
# ============================================
echo ""
echo "📝 Generating JWT secrets..."
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

echo "✅ JWT_SECRET: $JWT_SECRET"
echo "✅ JWT_REFRESH_SECRET: $JWT_REFRESH_SECRET"

# ============================================
# 2. Railway Backend
# ============================================
echo ""
echo "🚂 Configuring Railway backend..."
cd backend

railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set API_PREFIX=api/v1
railway variables set DB_SYNC=false
railway variables set DB_LOGGING=false
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set JWT_EXPIRATION="15m"
railway variables set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
railway variables set JWT_REFRESH_EXPIRATION="7d"
railway variables set THROTTLE_TTL=60
railway variables set THROTTLE_LIMIT=100
railway variables set STORAGE_PROVIDER=local
railway variables set MAX_FILE_SIZE=5242880
railway variables set UPLOAD_DIR=./uploads
railway variables set DEFAULT_PAGE_SIZE=20
railway variables set MAX_PAGE_SIZE=100
railway variables set LOG_LEVEL=info

echo "✅ Railway backend configured!"

# Get Railway URL
RAILWAY_URL=$(railway status --json | jq -r '.service.url')
echo "📍 Railway backend URL: $RAILWAY_URL"

# ============================================
# 3. Update CORS (will be updated after Vercel deploy)
# ============================================
echo ""
echo "⚠️  Remember to update CORS after deploying frontend:"
echo "railway variables set CORS_ORIGINS=\"https://your-vercel-app.vercel.app,https://*.vercel.app\""

# ============================================
# 4. Vercel Frontend
# ============================================
echo ""
echo "▲ Configuring Vercel frontend..."
cd ../medium-clone-blog-platform

# Note: This requires manual input
echo "⚠️  Set Vercel variables manually:"
echo "vercel env add NEXT_PUBLIC_API_URL production"
echo "Value: ${RAILWAY_URL}/api/v1"

# ============================================
# 5. Summary
# ============================================
echo ""
echo "✅ Environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy to Vercel and get frontend URL"
echo "2. Update Railway CORS with Vercel URL"
echo "3. Add GitHub secrets for CI/CD"
echo "4. Test both endpoints"
echo ""
echo "🔗 URLs to configure:"
echo "Backend:  $RAILWAY_URL"
echo "Frontend: (Get from Vercel after deployment)"
```

Save as `setup-env.sh`, make executable, and run:

```bash
chmod +x setup-env.sh
./setup-env.sh
```

---

## ✅ Final Checklist

### Railway (Backend)

- [ ] PostgreSQL database added
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` set (32-byte random)
- [ ] `JWT_REFRESH_SECRET` set (32-byte random)
- [ ] `CORS_ORIGINS` includes Vercel domains
- [ ] `DB_SYNC=false`
- [ ] All variables verified with `railway variables`
- [ ] Deployed successfully
- [ ] Health check passes: `/api/v1/health`

### Vercel (Frontend)

- [ ] `NEXT_PUBLIC_API_URL` set to Railway URL
- [ ] `NODE_ENV=production`
- [ ] Variables set for Production, Preview, Development
- [ ] Deployed successfully
- [ ] Health check passes: `/api/health`
- [ ] Can connect to backend (no CORS errors)

### GitHub Actions

- [ ] Backend: `RAILWAY_TOKEN` secret added
- [ ] Frontend: `VERCEL_TOKEN` secret added
- [ ] Frontend: `VERCEL_ORG_ID` secret added
- [ ] Frontend: `VERCEL_PROJECT_ID` secret added
- [ ] Frontend: `NEXT_PUBLIC_API_URL` secret added
- [ ] Optional: `SLACK_WEBHOOK_URL` added to both
- [ ] Workflows run successfully

### Documentation

- [ ] `.env.production.example` exists in backend
- [ ] `.env.production.example` exists in frontend
- [ ] Deployment docs updated with actual URLs
- [ ] README badges show passing builds
- [ ] All secrets documented (not committed!)

---

## 📚 References

- **Railway Variables:** [docs.railway.app/develop/variables](https://docs.railway.app/develop/variables)
- **Vercel Env Vars:** [vercel.com/docs/concepts/projects/environment-variables](https://vercel.com/docs/concepts/projects/environment-variables)
- **GitHub Secrets:** [docs.github.com/en/actions/security-guides/encrypted-secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- **JWT Best Practices:** [tools.ietf.org/html/rfc8725](https://tools.ietf.org/html/rfc8725)

---

**🎉 Your production environment is now fully configured!**

All environment variables are set up securely across Railway, Vercel, and GitHub Actions.
