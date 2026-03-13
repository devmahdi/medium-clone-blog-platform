# 🚀 Vercel Quick Start - 5 Minutes

Deploy your Next.js frontend to Vercel in under 5 minutes.

## Prerequisites

- Vercel account → [Sign up free](https://vercel.com)
- Repository on GitHub
- Railway backend deployed
- 5 minutes ⏱️

---

## Step 1: Import Project

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select `devmahdi/medium-clone-blog-platform`
4. Click **"Import"**

---

## Step 2: Configure Build Settings

Vercel will detect Next.js automatically. Update these settings:

```
Framework Preset: Next.js
Root Directory: ./
Build Command: cd apps/frontend && pnpm build
Output Directory: apps/frontend/.next
Install Command: pnpm install
```

**Don't deploy yet!** First, add environment variables.

---

## Step 3: Add Environment Variables

Click **"Environment Variables"** and add:

```
NEXT_PUBLIC_API_URL = https://your-railway-app.up.railway.app/api/v1
NODE_ENV = production
```

**Important:** Replace `your-railway-app.up.railway.app` with your actual Railway backend URL!

Get your Railway URL:
```bash
railway status
# Or visit Railway dashboard
```

---

## Step 4: Deploy

1. Click **"Deploy"**
2. Wait ~2 minutes for build to complete
3. Click **"Visit"** to see your live site!

---

## Step 5: Update Backend CORS

Your backend needs to allow requests from Vercel:

```bash
# In Railway, update CORS_ORIGINS:
railway variables set CORS_ORIGINS="https://your-vercel-app.vercel.app"

# Or in Railway dashboard:
# Settings → Variables → CORS_ORIGINS
```

---

## Step 6: Verify Deployment

Test these endpoints:

1. **Homepage:** `https://your-app.vercel.app`
2. **Health Check:** `https://your-app.vercel.app/api/health`
3. **Backend Connection:** Should work if CORS is configured

---

## Next Steps (Optional)

### Add Custom Domain

1. Go to **Settings → Domains**
2. Click **"Add"**
3. Enter `yourdomain.com`
4. Add DNS records as shown
5. Wait 5-15 minutes for SSL

### Enable Analytics

1. Click **"Analytics"** tab
2. Enable **"Speed Insights"**
3. Enable **"Web Analytics"**
4. View real-time data!

---

## Troubleshooting

### Can't connect to backend?

**Check:**
```bash
# 1. Is backend URL correct?
echo $NEXT_PUBLIC_API_URL

# 2. Is backend running?
curl https://your-railway-app.up.railway.app/api/v1/health

# 3. Is CORS configured?
# In Railway: CORS_ORIGINS should include your Vercel domain
```

### Build fails?

**Common fixes:**
1. Ensure `pnpm install` is the install command
2. Check Node.js version is 20.x+
3. Verify monorepo build command is correct

---

## Automatic Deployments

Vercel now auto-deploys on:
- ✅ Every push to `main` → Production
- ✅ Every PR → Preview deployment

Just `git push` and watch it deploy! 🚀

---

## Your URLs

After deployment, you'll have:

- **Production:** `https://your-app.vercel.app`
- **Preview:** `https://your-app-git-[branch].vercel.app` (for PRs)
- **Custom:** `https://yourdomain.com` (if configured)

---

**🎉 That's it! Your frontend is live on Vercel!**

Total setup time: ~5 minutes ⚡

For detailed configuration, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
