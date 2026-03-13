# Blog Platform - Medium Clone

A modern, minimal blog platform inspired by Medium. Built with Next.js 16+ frontend and NestJS backend.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

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

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- [x] Monorepo setup
- [x] Next.js frontend initialization
- [x] NestJS backend initialization
- [x] TypeScript configuration
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

### Phase 5: Deployment
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Vercel deployment (frontend)
- [ ] Railway deployment (backend)
- [ ] Database migrations

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
