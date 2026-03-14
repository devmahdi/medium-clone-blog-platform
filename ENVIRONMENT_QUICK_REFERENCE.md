# 🚀 Environment Variables - Quick Reference Card

**Print this and keep it handy!**

---

## 🔑 Generate Secrets

```bash
# JWT_SECRET
openssl rand -base64 32

# JWT_REFRESH_SECRET  
openssl rand -base64 32
```

---

## 🚂 Railway (Backend) - Essential Variables

```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET="<generated-secret-1>"
railway variables set JWT_REFRESH_SECRET="<generated-secret-2>"
railway variables set CORS_ORIGINS="https://*.vercel.app"
railway variables set DB_SYNC=false
```

**Auto-provided by Railway:**
- `DATABASE_URL` ✅
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` ✅

---

## ▲ Vercel (Frontend) - Essential Variables

Via Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-app.up.railway.app/api/v1` |
| `NODE_ENV` | `production` |

---

## 🔐 GitHub Secrets

### Backend (`devmahdi/backend`)

| Secret | Command to Get |
|--------|----------------|
| `RAILWAY_TOKEN` | `railway tokens` |

### Frontend (`devmahdi/medium-clone-blog-platform`)

| Secret | Command to Get |
|--------|----------------|
| `VERCEL_TOKEN` | Vercel → Account → Tokens |
| `VERCEL_ORG_ID` | `cat .vercel/project.json` |
| `VERCEL_PROJECT_ID` | `cat .vercel/project.json` |
| `NEXT_PUBLIC_API_URL` | From Railway: `railway status` |

---

## ✅ Verification Commands

```bash
# Railway
railway variables
railway status
curl https://your-app.up.railway.app/api/v1/health

# Vercel
vercel env ls
vercel ls
curl https://your-app.vercel.app/api/health

# GitHub
# Check: Repo → Settings → Secrets and variables → Actions
```

---

## 🔗 URLs After Deployment

| Service | URL Format | Example |
|---------|------------|---------|
| **Railway Backend** | `https://<name>.up.railway.app` | `https://backend-prod.up.railway.app` |
| **Vercel Frontend** | `https://<name>.vercel.app` | `https://medium-clone.vercel.app` |
| **Backend API** | Railway URL + `/api/v1` | `https://backend.up.railway.app/api/v1` |
| **Backend Health** | Backend API + `/health` | `https://backend.up.railway.app/api/v1/health` |
| **Frontend Health** | Vercel URL + `/api/health` | `https://app.vercel.app/api/health` |

---

## 🐛 Common Issues

| Problem | Fix |
|---------|-----|
| CORS error | Update `CORS_ORIGINS` in Railway to include Vercel URL |
| API_URL undefined | Set `NEXT_PUBLIC_API_URL` in Vercel |
| Database connection failed | Ensure PostgreSQL service added in Railway |
| JWT error | Verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are set |
| Build fails | Check `NODE_ENV=production` is set |

---

## 📋 Setup Order

1. ✅ Deploy backend to Railway
2. ✅ Get Railway backend URL
3. ✅ Set Railway environment variables (JWT secrets, CORS)
4. ✅ Deploy frontend to Vercel  
5. ✅ Set Vercel environment variables (NEXT_PUBLIC_API_URL)
6. ✅ Get Vercel frontend URL
7. ✅ Update Railway CORS with Vercel URL
8. ✅ Add GitHub secrets for CI/CD
9. ✅ Test both health endpoints

---

**⚠️ Security Reminders:**
- Never commit `.env` files
- Rotate JWT secrets every 90 days
- Use `DB_SYNC=false` in production
- Specify exact CORS domains
- Different secrets for dev/staging/production

---

**📞 Need Help?**
- Full guide: `ENV_CONFIGURATION_GUIDE.md`
- Railway docs: `backend/DEPLOYMENT.md`
- Vercel docs: `VERCEL_DEPLOYMENT.md`
