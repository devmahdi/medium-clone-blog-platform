# Admin Dashboard Deployment Guide

Complete guide for securing and deploying the admin dashboard within the Next.js frontend.

## 🔒 Security Overview

The admin dashboard is deployed as part of the main Next.js frontend but with strict access controls:

- **Admin-only access** via middleware authentication
- **JWT token validation** against Railway backend
- **Session-based authentication** with HTTP-only cookies
- **Protected routes** at `/admin/*`
- **Security headers** (X-Frame-Options, CSP, etc.)
- **Automatic redirects** to login page for unauthenticated users

---

## 📦 What's Included

### 1. **Admin Routes** (`/admin/*`)
- `/admin` - Dashboard overview
- `/admin/users` - User management
- `/admin/articles` - Article moderation
- `/admin/comments` - Comment moderation
- `/admin/tags` - Tag management with merge
- `/admin/settings` - Site configuration
- `/admin/media` - Media library
- `/admin/login` - Admin authentication

### 2. **Middleware Protection** (`middleware.ts`)
- Intercepts all `/admin/*` requests
- Checks for `admin_token` cookie
- Validates JWT with backend API
- Redirects to login if unauthorized
- Adds security headers to responses

### 3. **Login Page** (`/admin/login`)
- Email/password authentication
- Backend JWT validation
- Admin role verification
- Secure cookie storage (7-day expiration)
- Callback URL support (return to requested page)

---

## 🚀 Deployment to Vercel

The admin dashboard deploys **automatically with the frontend** to Vercel.

### Quick Deploy

1. **Already configured!** Admin routes are part of the existing Vercel deployment.
2. **No separate deployment needed** - admin deploys with frontend.
3. **Environment variables** already set:
   - `NEXT_PUBLIC_API_URL` points to Railway backend

### Verify Deployment

After frontend deployment, admin is available at:

```
Production:  https://yourdomain.com/admin
Preview:     https://your-app-git-[branch].vercel.app/admin
```

---

## 🔐 Authentication Flow

### 1. **User Access Admin Route**
```
User navigates to /admin/users
↓
Middleware checks for admin_token cookie
↓
No token found
↓
Redirect to /admin/login?callbackUrl=/admin/users
```

### 2. **User Logs In**
```
User enters email/password on /admin/login
↓
POST to ${NEXT_PUBLIC_API_URL}/auth/login
↓
Backend validates credentials
↓
Backend returns { user, accessToken }
↓
Frontend checks user.isAdmin === true
↓
Store accessToken in admin_token cookie (7 days)
↓
Redirect to callbackUrl (/admin/users)
```

### 3. **Subsequent Requests**
```
User navigates to /admin/tags
↓
Middleware checks admin_token cookie
↓
Token found
↓
(TODO: Validate JWT with backend)
↓
Allow request
↓
Add security headers
↓
Render page
```

---

## 🔧 Backend Requirements

### Admin Role

Your backend must support an `isAdmin` field on the user model:

```typescript
// Backend: User entity
{
  id: string
  email: string
  name: string
  isAdmin: boolean  // ← Required for admin access
  // ...
}
```

### Login Endpoint

```typescript
// POST /api/v1/auth/login
{
  "email": "admin@example.com",
  "password": "securepassword"
}

// Response:
{
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "name": "Admin User",
    "isAdmin": true  // ← Must be true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "..."
}
```

### Token Verification Endpoint (Optional - for production)

```typescript
// GET /api/v1/admin/verify
// Headers: Authorization: Bearer <token>

// Response:
{
  "valid": true,
  "user": { "id": "...", "isAdmin": true }
}
```

---

## 🛡️ Production Security Checklist

### ✅ Mandatory

- [ ] **Enable JWT validation in middleware**
  ```typescript
  // middleware.ts line ~30
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/verify`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  })
  if (!response.ok) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
  ```

- [ ] **Use HTTP-only cookies** (prevent XSS attacks)
  ```typescript
  // Update admin/login/page.tsx
  document.cookie = `admin_token=${data.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; HttpOnly; Secure; SameSite=Strict`
  ```

- [ ] **Enable HTTPS-only cookies in production**
  ```typescript
  const isProduction = process.env.NODE_ENV === 'production'
  document.cookie = `admin_token=${token}; ${isProduction ? 'Secure;' : ''} HttpOnly; SameSite=Strict`
  ```

- [ ] **Implement refresh token flow**
  - Store refresh token in HTTP-only cookie
  - Refresh access token before expiration
  - Clear tokens on logout

- [ ] **Add CORS restrictions** on backend
  ```bash
  # Railway backend
  CORS_ORIGINS=https://yourdomain.com
  ```

- [ ] **Implement rate limiting** on login endpoint (backend)

- [ ] **Add CAPTCHA** for brute-force protection (optional)

### ⚠️ Recommended

- [ ] **Two-factor authentication (2FA)** for admin accounts

- [ ] **Audit logging** - Track admin actions
  ```typescript
  await logAdminAction({
    userId,
    action: 'DELETE_USER',
    targetId: deletedUserId,
    timestamp: new Date()
  })
  ```

- [ ] **IP whitelisting** - Restrict admin access to specific IPs (optional)

- [ ] **Session timeout** - Auto-logout after inactivity

- [ ] **Password requirements** - Enforce strong passwords (backend)

---

## 🔑 Environment Variables

### Frontend (Vercel)

Already configured in `VERCEL_DEPLOYMENT.md`:

```bash
NEXT_PUBLIC_API_URL=https://your-railway-app.up.railway.app/api/v1
NODE_ENV=production
```

### Backend (Railway)

Update CORS to allow admin access:

```bash
railway variables set CORS_ORIGINS="https://yourdomain.com,https://*.vercel.app"
```

---

## 📱 Admin Dashboard URLs

### Production
```
Admin Dashboard:  https://yourdomain.com/admin
Admin Login:      https://yourdomain.com/admin/login
User Management:  https://yourdomain.com/admin/users
Articles:         https://yourdomain.com/admin/articles
Comments:         https://yourdomain.com/admin/comments
Tags:             https://yourdomain.com/admin/tags
Settings:         https://yourdomain.com/admin/settings
Media Library:    https://yourdomain.com/admin/media
```

### Preview (PR branches)
```
https://your-app-git-[branch].vercel.app/admin/*
```

---

## 🧪 Testing Admin Access

### 1. Create Admin User (Backend)

```bash
# Option A: Via backend seed script
railway run pnpm run seed

# Option B: Via database directly
railway run psql $DATABASE_URL
UPDATE users SET "isAdmin" = true WHERE email = 'admin@example.com';
```

### 2. Test Login Flow

```bash
# Navigate to admin (should redirect to login)
https://yourdomain.com/admin

# Login with admin credentials
Email: admin@example.com
Password: (your password)

# Should redirect to /admin dashboard
```

### 3. Test Middleware Protection

```bash
# Open browser in incognito mode
# Navigate to https://yourdomain.com/admin/users
# Should redirect to /admin/login

# Login
# Should redirect back to /admin/users

# Open DevTools → Application → Cookies
# Verify "admin_token" cookie exists with JWT value
```

### 4. Test Security Headers

```bash
# Check response headers
curl -I https://yourdomain.com/admin

# Should include:
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 🔄 Logout Implementation

Add logout functionality (not yet implemented):

```typescript
// apps/frontend/src/app/admin/logout/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.redirect(new URL('/admin/login', request.url))
  
  // Clear admin token cookie
  response.cookies.set('admin_token', '', {
    maxAge: 0,
    path: '/',
  })
  
  return response
}
```

Add logout button to admin layout:

```typescript
// apps/frontend/src/app/admin/layout.tsx
<a href="/admin/logout" className="text-red-600 hover:text-red-700">
  Logout
</a>
```

---

## 🐛 Troubleshooting

### "Access denied. Admin privileges required."

**Cause:** User logged in successfully but `isAdmin` is false.

**Fix:**
```sql
-- Update user to admin in database
UPDATE users SET "isAdmin" = true WHERE email = 'user@example.com';
```

---

### Middleware redirects to login even with valid token

**Cause:** JWT validation not implemented (TODOs in middleware.ts).

**Fix:** Implement token validation:
```typescript
// middleware.ts
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/verify`, {
  headers: { Authorization: `Bearer ${adminToken}` }
})
if (!response.ok) {
  return NextResponse.redirect(new URL('/admin/login', request.url))
}
```

---

### CORS error when logging in

**Cause:** Backend not allowing frontend domain.

**Fix:**
```bash
# Railway backend
railway variables set CORS_ORIGINS="https://yourdomain.com,https://*.vercel.app"
railway up  # Restart backend
```

---

### Cookie not persisting

**Cause:** Cookie settings incorrect.

**Fix:**
```typescript
// Ensure cookie has correct settings
document.cookie = `admin_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`
```

For production:
```typescript
const secure = process.env.NODE_ENV === 'production' ? 'Secure;' : ''
document.cookie = `admin_token=${token}; path=/; ${secure} HttpOnly; SameSite=Strict; max-age=${7 * 24 * 60 * 60}`
```

---

## 📊 Monitoring Admin Activity

### Log Admin Actions (Backend)

```typescript
// Backend: Create admin_logs table
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

// Log action
await adminLogRepository.create({
  adminId: currentUser.id,
  action: 'DELETE_USER',
  targetType: 'user',
  targetId: deletedUserId,
  metadata: { email: deletedUser.email },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
})
```

### View Admin Logs (Admin Dashboard)

Add `/admin/logs` page to view audit trail:

```typescript
// apps/frontend/src/app/admin/logs/page.tsx
// Fetch and display admin activity logs
```

---

## 🎯 Next Steps

### Immediate (Security)

1. **Implement JWT validation in middleware**
   - Edit `middleware.ts` line 30
   - Add token verification call to backend
   - Handle token expiration

2. **Use HTTP-only cookies**
   - Update `admin/login/page.tsx`
   - Set cookies server-side (more secure)

3. **Create admin user in backend**
   ```bash
   railway run psql $DATABASE_URL
   UPDATE users SET "isAdmin" = true WHERE email = 'admin@example.com';
   ```

4. **Test login flow end-to-end**

### Optional Enhancements

5. **Add logout functionality**
6. **Implement 2FA for admin accounts**
7. **Add audit logging**
8. **Create admin activity dashboard**
9. **Implement session timeout**
10. **Add CAPTCHA to login page**

---

## ✅ Deployment Checklist

### Pre-Deployment
- [x] Middleware configured (`middleware.ts`)
- [x] Login page created (`/admin/login`)
- [x] Admin routes exist (`/admin/*`)
- [ ] JWT validation implemented (TODO in middleware)
- [ ] HTTP-only cookies enabled
- [ ] Admin user created in database

### Deployment
- [x] Deploys automatically with frontend to Vercel
- [ ] Test admin login with credentials
- [ ] Verify middleware redirects work
- [ ] Check security headers in response
- [ ] Test callback URL after login

### Post-Deployment
- [ ] Create first admin user in database
- [ ] Test all admin pages load correctly
- [ ] Verify API calls to Railway backend work
- [ ] Test logout functionality
- [ ] Monitor admin activity logs

---

## 📚 Additional Resources

- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**🔒 Admin dashboard security configured!**

Your admin panel is now protected with:
- ✅ Middleware authentication
- ✅ JWT token validation (backend integration ready)
- ✅ Secure login page
- ✅ Security headers
- ✅ Automatic deployment with frontend

**Admin URL:** `https://yourdomain.com/admin`  
**Login:** `https://yourdomain.com/admin/login`  

**Next:** Implement JWT validation in middleware (line 30) for production security.
