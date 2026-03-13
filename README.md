# Blog Platform - Medium Clone

A modern, minimal blog platform inspired by Medium. Built with Next.js 16+ frontend, NestJS backend, and admin dashboard.

[![Vercel Deployment](https://github.com/devmahdi/medium-clone-blog-platform/actions/workflows/vercel-deploy.yml/badge.svg)](https://github.com/devmahdi/medium-clone-blog-platform/actions/workflows/vercel-deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## ⚡ Quick Links

- **Frontend Deployment:** [VERCEL_QUICK_START.md](./VERCEL_QUICK_START.md) (5 min)
- **Backend Deployment:** [apps/backend/RAILWAY_QUICK_START.md](./apps/backend/RAILWAY_QUICK_START.md) (10 min)
- **Admin Setup:** [ADMIN_QUICK_START.md](./ADMIN_QUICK_START.md) (5 min)
- **Full Documentation:** See deployment guides below

## 🏗️ Project Architecture

This is a **monorepo** using **pnpm workspaces** with the following structure:

```
medium-clone-blog-platform/
├── apps/
│   ├── frontend/          # Next.js 16+ application
│   └── backend/           # NestJS REST API
├── packages/              # Shared packages (future)
└── pnpm-workspace.yaml    # Workspace configuration
```

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript 5.7+
- **Styling**: Tailwind CSS 3.4+
- **UI Components**: Custom components with Headless UI
- **State Management**: React Server Components + Context API
- **HTTP Client**: Fetch API / Axios

### Backend
- **Framework**: NestJS 10+
- **Language**: TypeScript 5.7+
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator & class-transformer
- **API Documentation**: Swagger (future)

### Development Tools
- **Package Manager**: pnpm 9.15+
- **Linting**: ESLint
- **Formatting**: Prettier
- **Version Control**: Git
- **CI/CD**: GitHub Actions (to be configured)

## 📋 Prerequisites

- Node.js 20.0.0 or higher
- pnpm 9.0.0 or higher
- PostgreSQL 14+ (for backend)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/devmahdi/medium-clone-blog-platform.git
   cd medium-clone-blog-platform
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   **Backend:**
   ```bash
   cd apps/backend
   cp .env.example .env
   # Edit .env with your database credentials
   ```

   **Frontend:**
   ```bash
   cd apps/frontend
   cp .env.example .env.local
   ```

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb blog_platform
   
   # TypeORM will auto-sync in development mode
   ```

## 🚦 Running the Application

### Development Mode

Run both frontend and backend concurrently:
```bash
pnpm dev
```

Or run them separately:

**Frontend only:**
```bash
cd apps/frontend
pnpm dev
```
Access at: http://localhost:3000

**Backend only:**
```bash
cd apps/backend
pnpm dev
```
API at: http://localhost:3001

### Production Build

```bash
pnpm build
```

## 📁 Project Structure

### Frontend (`apps/frontend`)
```
src/
├── app/              # Next.js App Router pages
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles
├── components/       # Reusable React components
├── lib/              # Utility functions & API client
└── types/            # TypeScript type definitions
```

### Backend (`apps/backend`)
```
src/
├── modules/          # Feature modules
│   ├── auth/         # Authentication & authorization
│   ├── users/        # User management
│   ├── posts/        # Blog post CRUD
│   └── comments/     # Comments system
├── common/           # Shared utilities
│   ├── decorators/   # Custom decorators
│   ├── guards/       # Auth & role guards
│   ├── filters/      # Exception filters
│   ├── interceptors/ # Response interceptors
│   └── pipes/        # Validation pipes
├── config/           # Configuration modules
├── app.module.ts     # Root module
└── main.ts           # Application entry point
```

## 🔐 Best Practices Implemented

### Code Quality
- ✅ **Strict TypeScript** configuration
- ✅ **ESLint** for code linting
- ✅ **Prettier** for code formatting
- ✅ **Path aliases** (@/* imports)

### Security
- ✅ **Environment variables** for sensitive data
- ✅ **JWT authentication** (backend)
- ✅ **CORS** configuration
- ✅ **Input validation** with class-validator
- ✅ **SQL injection protection** via TypeORM

### Performance
- ✅ **Next.js App Router** with Server Components
- ✅ **Image optimization** (Next.js)
- ✅ **Code splitting** automatic
- ✅ **Database connection pooling**

### Development Workflow
- ✅ **Monorepo** structure for code sharing
- ✅ **Hot reload** in development
- ✅ **Type safety** across stack
- ✅ **Git-friendly** structure

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Frontend tests
cd apps/frontend
pnpm test

# Backend tests
cd apps/backend
pnpm test
```

## 📦 Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps for production |
| `pnpm lint` | Lint all apps |
| `pnpm format` | Format code with Prettier |
| `pnpm test` | Run tests across all apps |
| `pnpm clean` | Clean all node_modules and build artifacts |

## 🚀 Deployment

This project is configured for seamless deployment to production platforms:

### Frontend → Vercel

**Quick Start (5 minutes):**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import this repository
3. Configure as monorepo:
   - Build Command: `cd apps/frontend && pnpm build`
   - Output Directory: `apps/frontend/.next`
   - Install Command: `pnpm install`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Railway backend URL
5. Deploy!

**📖 Documentation:**
- **Quick Start:** [VERCEL_QUICK_START.md](./VERCEL_QUICK_START.md) - 5-minute setup
- **Full Guide:** [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Complete deployment guide
- **Troubleshooting:** [VERCEL_TROUBLESHOOTING.md](./VERCEL_TROUBLESHOOTING.md) - Common issues

**Features:**
- ✅ Auto-deploy on push to main
- ✅ Preview deployments for PRs
- ✅ Vercel Analytics & Speed Insights
- ✅ Global CDN (40+ regions)
- ✅ Automatic SSL/HTTPS
- ✅ Edge Functions support
- ✅ ISR & caching

### Backend → Railway

**Quick Start (10 minutes):**
```bash
npm install -g @railway/cli
cd apps/backend
# Follow setup in backend DEPLOYMENT.md
```

**📖 Documentation:**
- See `apps/backend/DEPLOYMENT.md` for complete guide
- Railway provides PostgreSQL, Redis, auto-SSL

**What Gets Deployed:**
- ✅ NestJS API with PostgreSQL
- ✅ Database migrations
- ✅ Health monitoring
- ✅ Auto-scaling

### Admin Dashboard → Vercel (Same as Frontend)

**Quick Start (5 minutes):**
1. **Create admin user in database:**
   ```bash
   railway run psql $DATABASE_URL
   UPDATE users SET "isAdmin" = true WHERE email = 'admin@example.com';
   ```

2. **Access admin:**
   ```
   https://yourdomain.com/admin
   ```

3. **Login with admin credentials**

**📖 Documentation:**
- **Quick Start:** [ADMIN_QUICK_START.md](./ADMIN_QUICK_START.md) - 5-minute setup
- **Full Guide:** [ADMIN_DEPLOYMENT.md](./ADMIN_DEPLOYMENT.md) - Security & deployment guide

**Features:**
- ✅ Middleware authentication (JWT)
- ✅ Admin-only access control
- ✅ Secure session management
- ✅ Auto-deploy with frontend
- ✅ User management
- ✅ Article moderation
- ✅ Comment moderation
- ✅ Tag management with merge
- ✅ Site settings
- ✅ Media library

**Admin Routes:**
- `/admin` - Dashboard
- `/admin/users` - User management
- `/admin/articles` - Article moderation
- `/admin/comments` - Comment moderation
- `/admin/tags` - Tag management
- `/admin/settings` - Site configuration
- `/admin/media` - Media library

### CI/CD Pipeline

Both frontend and backend have GitHub Actions workflows:

**Frontend:**
- `.github/workflows/vercel-deploy.yml`
- Linting, type-checking, building
- Automatic preview & production deployments
- Health checks & Slack notifications

**Backend:**
- `apps/backend/.github/workflows/railway-deploy.yml`
- Testing, linting, building
- Database migrations
- Deployment verification

### Architecture After Deployment

```
┌─────────────────────────────────────────┐
│          Vercel (Global CDN)            │
│   https://yourdomain.com                │
│   ┌─────────────────────────────────┐   │
│   │     Next.js Frontend            │   │
│   │   - App Router                  │   │
│   │   - Server Components           │   │
│   │   - Edge Functions              │   │
│   └──────────────┬──────────────────┘   │
└────────────────────│─────────────────────┘
                    │
                    │ HTTPS/REST API
                    ▼
┌─────────────────────────────────────────┐
│         Railway (Cloud Platform)        │
│   https://your-app.up.railway.app       │
│   ┌─────────────────────────────────┐   │
│   │      NestJS Backend             │   │
│   │   - REST API                    │   │
│   │   - JWT Auth                    │   │
│   └──────────────┬──────────────────┘   │
│                  │                       │
│   ┌──────────────┴──────────────┐       │
│   │                             │       │
│   ▼                             ▼       │
│ ┌──────────┐             ┌──────────┐  │
│ │PostgreSQL│             │  Redis   │  │
│ └──────────┘             └──────────┘  │
└─────────────────────────────────────────┘
```

### Deployment URLs

After deployment, your app will be live at:

- **Frontend:** `https://yourdomain.com` (or `https://your-app.vercel.app`)
- **Backend API:** `https://your-railway-app.up.railway.app/api/v1`
- **API Docs:** `https://your-railway-app.up.railway.app/api/docs`
- **Health Checks:**
  - Frontend: `https://yourdomain.com/api/health`
  - Backend: `https://your-railway-app.up.railway.app/api/v1/health`

### Cost Estimate

| Service | Free Tier | Recommended Plan | Cost |
|---------|-----------|------------------|------|
| Vercel | 100GB bandwidth | Hobby (Free) | $0 |
| Railway | $5 credit/month | Hobby | $5/month |
| **Total** | - | - | **$5/month** |

### Deployment Checklist

- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] Custom domains set up (optional)
- [ ] SSL certificates active
- [ ] CORS configured between frontend/backend
- [ ] Health checks passing
- [ ] CI/CD pipelines working
- [ ] Analytics enabled

---

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- [x] Monorepo setup
- [x] Next.js frontend initialization
- [x] NestJS backend initialization
- [x] TypeScript configuration
- [x] Deployment configuration (Vercel + Railway)
- [x] CI/CD pipelines
- [ ] Database schema design

### Phase 2: Core Features
- [ ] User authentication (JWT)
- [ ] User profiles
- [ ] Post creation & editing (rich text)
- [ ] Post listing & reading
- [ ] Comments system
- [ ] Like/clap functionality

### Phase 3: Enhanced Features
- [ ] User following system
- [ ] Feed algorithm
- [ ] Search functionality
- [ ] Tags & categories
- [ ] Image upload
- [ ] Draft/publish workflow

### Phase 4: Polish
- [ ] Responsive design
- [ ] Dark mode
- [ ] SEO optimization
- [ ] Performance optimization
- [ ] Accessibility (WCAG 2.1)

### Phase 5: Production ✅
- [x] Docker containerization (optional)
- [x] CI/CD pipeline
- [x] Vercel deployment (frontend)
- [x] Railway deployment (backend)
- [x] Database migrations
- [x] Health monitoring
- [x] Analytics integration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Medium](https://medium.com)
- Built with [Next.js](https://nextjs.org)
- Powered by [NestJS](https://nestjs.com)

---

**Built with ❤️ for the writing community**
