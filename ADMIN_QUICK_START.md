# 🔐 Admin Dashboard - Quick Start

Get your admin dashboard secured and deployed in under 5 minutes.

## Prerequisites

- Frontend deployed to Vercel ✅
- Backend deployed to Railway ✅
- Admin user created in database

---

## Step 1: Create Admin User (2 minutes)

### Option A: Via Railway Database Console

```bash
# Connect to Railway database
railway run psql $DATABASE_URL

# Promote user to admin
UPDATE users SET "isAdmin" = true WHERE email = 'admin@example.com';

# Verify
SELECT id, email, "isAdmin" FROM users WHERE "isAdmin" = true;

# Exit
\q
```

### Option B: Via Backend Seed Script

```bash
# If you have a seed script that creates admin users
railway run pnpm run seed
```

---

## Step 2: Access Admin Dashboard (1 minute)

1. **Navigate to admin:**
   ```
   https://yourdomain.com/admin
   ```

2. **You'll be redirected to login:**
   ```
   https://yourdomain.com/admin/login
   ```

3. **Enter admin credentials:**
   - Email: `admin@example.com`
   - Password: (your password)

4. **Click "Sign in"**
   - Should redirect to admin dashboard
   - Check for `admin_token` cookie in DevTools

---

## Step 3: Verify Admin Access (1 minute)

Test these admin pages:

```
✅ Dashboard:     https://yourdomain.com/admin
✅ Users:         https://yourdomain.com/admin/users
✅ Articles:      https://yourdomain.com/admin/articles
✅ Comments:      https://yourdomain.com/admin/comments
✅ Tags:          https://yourdomain.com/admin/tags
✅ Settings:      https://yourdomain.com/admin/settings
✅ Media:         https://yourdomain.com/admin/media
```

All pages should load without redirecting to login.

---

## Step 4: Secure for Production (1 minute)

### Enable JWT Validation

Edit `apps/frontend/middleware.ts` line ~30:

```typescript
// Uncomment this section:
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/verify`, {
  headers: { Authorization: `Bearer ${adminToken}` }
})
if (!response.ok) {
  return NextResponse.redirect(new URL('/admin/login', request.url))
}
```

### Redeploy

```bash
git add apps/frontend/middleware.ts
git commit -m "Enable admin JWT validation"
git push origin main

# Vercel auto-deploys in ~2 minutes
```

---

## 🎯 That's It!

Your admin dashboard is now:

- ✅ **Secured** - Only admin users can access
- ✅ **Deployed** - Live on Vercel with frontend
- ✅ **Protected** - Middleware intercepts all /admin/* routes
- ✅ **Session-based** - JWT token stored in secure cookie

---

## 🔒 Security Checklist

- [ ] Admin user created with `isAdmin = true`
- [ ] JWT validation enabled in middleware
- [ ] HTTP-only cookies configured (see ADMIN_DEPLOYMENT.md)
- [ ] CORS configured on Railway backend
- [ ] Strong password for admin account
- [ ] 2FA enabled (optional, recommended)

---

## 🐛 Troubleshooting

### Can't log in?

**Check backend logs:**
```bash
railway logs --filter error
```

**Verify user is admin:**
```sql
SELECT email, "isAdmin" FROM users WHERE email = 'admin@example.com';
```

### Still redirects to login after sign-in?

**Check if token is stored:**
- Open DevTools → Application → Cookies
- Look for `admin_token` cookie
- Value should be a JWT (long string starting with `eyJ`)

**If cookie exists but still redirects:**
- Middleware might be blocking due to validation
- Temporarily comment out validation in `middleware.ts` line 30
- Should work until JWT endpoint is implemented on backend

### CORS error?

**Update Railway backend:**
```bash
railway variables set CORS_ORIGINS="https://yourdomain.com,https://*.vercel.app"
railway up
```

---

## 📚 More Info

- **Full Guide:** [ADMIN_DEPLOYMENT.md](./ADMIN_DEPLOYMENT.md)
- **Vercel Deployment:** [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- **Backend Setup:** [apps/backend/DEPLOYMENT.md](./apps/backend/DEPLOYMENT.md)

---

**Total setup time: ~5 minutes** ⚡

**Admin URL:** https://yourdomain.com/admin
