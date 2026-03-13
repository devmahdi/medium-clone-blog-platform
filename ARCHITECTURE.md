# Architecture Documentation

## System Overview

This blog platform follows a **client-server architecture** with clear separation of concerns:

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Next.js 16+   │  HTTP   │   NestJS API    │   SQL   │   PostgreSQL    │
│   (Frontend)    │────────▶│   (Backend)     │────────▶│   (Database)    │
│   Port 3000     │  REST   │   Port 3001     │  TypeORM│                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

## Technology Decisions & Rationale

### Frontend: Next.js 16+

**Why Next.js 16?**
- ✅ **App Router**: Server Components reduce client-side JavaScript
- ✅ **Image Optimization**: Automatic image optimization with next/image
- ✅ **SEO-friendly**: Server-side rendering for better search indexing
- ✅ **Performance**: Built-in code splitting and lazy loading
- ✅ **Developer Experience**: Fast Refresh, TypeScript support out of the box

**Key Features Used:**
- **Server Components**: Default for better performance
- **Client Components**: Only where interactivity is needed
- **Route Groups**: Organize routes without affecting URL structure
- **Metadata API**: SEO optimization
- **Streaming**: Progressive page rendering

### Backend: NestJS

**Why NestJS?**
- ✅ **TypeScript-first**: Type safety across the entire stack
- ✅ **Architecture**: Built-in dependency injection and modular structure
- ✅ **Scalability**: Easy to scale and maintain as the app grows
- ✅ **Ecosystem**: Rich ecosystem with integrations (TypeORM, Passport, etc.)
- ✅ **Best Practices**: Enforces SOLID principles and clean architecture

**Key Patterns:**
- **Modular Design**: Each feature is a self-contained module
- **Dependency Injection**: Loose coupling, easier testing
- **Pipes**: Request validation and transformation
- **Guards**: Authentication and authorization
- **Interceptors**: Response transformation and logging
- **Filters**: Global error handling

### Database: PostgreSQL + TypeORM

**Why PostgreSQL?**
- ✅ **ACID Compliance**: Data integrity and consistency
- ✅ **Full-text Search**: Built-in search capabilities for posts
- ✅ **JSON Support**: Flexible schema for rich content
- ✅ **Performance**: Excellent for read-heavy workloads
- ✅ **Open Source**: No licensing costs

**Why TypeORM?**
- ✅ **Type Safety**: Compile-time type checking for queries
- ✅ **Migrations**: Version control for database schema
- ✅ **Active Record**: Intuitive API for CRUD operations
- ✅ **Relations**: Easy to define and query relationships

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    User     │         │    Post     │         │   Comment   │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ id          │────────<│ authorId    │────────<│ postId      │
│ email       │   1:N   │ title       │   1:N   │ userId      │
│ username    │         │ content     │         │ content     │
│ password    │         │ published   │         │ createdAt   │
│ bio         │         │ createdAt   │         └─────────────┘
│ avatar      │         │ updatedAt   │
│ createdAt   │         │ viewCount   │
└─────────────┘         │ likeCount   │
                        └─────────────┘

┌─────────────┐         ┌─────────────┐
│   Follow    │         │     Like    │
├─────────────┤         ├─────────────┤
│ followerId  │         │ userId      │
│ followingId │         │ postId      │
│ createdAt   │         │ createdAt   │
└─────────────┘         └─────────────┘
```

## API Design Principles

### RESTful Endpoints

```
Authentication:
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/auth/profile

Users:
GET    /api/v1/users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
GET    /api/v1/users/:id/posts
GET    /api/v1/users/:id/followers
GET    /api/v1/users/:id/following
POST   /api/v1/users/:id/follow

Posts:
GET    /api/v1/posts
GET    /api/v1/posts/:id
POST   /api/v1/posts
PATCH  /api/v1/posts/:id
DELETE /api/v1/posts/:id
POST   /api/v1/posts/:id/like
GET    /api/v1/posts/:id/comments

Comments:
GET    /api/v1/comments/:id
POST   /api/v1/comments
PATCH  /api/v1/comments/:id
DELETE /api/v1/comments/:id
```

### Response Format

**Success Response:**
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Security Best Practices

### Authentication Flow

```
1. User sends credentials to /auth/login
2. Backend validates credentials
3. If valid, generate JWT access + refresh tokens
4. Return tokens to client
5. Client stores tokens (httpOnly cookies recommended)
6. Client includes access token in Authorization header
7. Backend validates token on protected routes
8. If expired, use refresh token to get new access token
```

### Implemented Security Measures

- ✅ **Password Hashing**: bcrypt with salt rounds
- ✅ **JWT Tokens**: Short-lived access tokens (15min) + long-lived refresh (7d)
- ✅ **CORS**: Whitelist allowed origins
- ✅ **Input Validation**: class-validator on all DTOs
- ✅ **SQL Injection Protection**: TypeORM parameterized queries
- ✅ **Rate Limiting**: Prevent brute force attacks (to be implemented)
- ✅ **Helmet**: Security headers (to be implemented)

## Frontend Architecture

### Component Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes group
│   │   ├── login/
│   │   └── signup/
│   ├── (main)/              # Main app routes
│   │   ├── feed/
│   │   ├── post/[id]/
│   │   └── profile/[username]/
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   ├── ui/                  # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── features/            # Feature-specific components
│   │   ├── PostCard.tsx
│   │   ├── CommentList.tsx
│   │   └── UserAvatar.tsx
│   └── layouts/             # Layout components
│       ├── Header.tsx
│       └── Footer.tsx
├── lib/
│   ├── api.ts               # API client
│   ├── auth.ts              # Auth utilities
│   └── utils.ts             # Helper functions
└── types/
    ├── user.ts
    ├── post.ts
    └── api.ts
```

### State Management Strategy

- **Server State**: React Server Components (default)
- **Client State**: React Context API for global state
- **Forms**: React Hook Form with zod validation
- **Data Fetching**: Native fetch with Next.js caching

## Backend Architecture

### Module Structure

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   └── posts/
│       ├── posts.controller.ts
│       ├── posts.service.ts
│       ├── posts.module.ts
│       ├── entities/
│       │   └── post.entity.ts
│       └── dto/
│           ├── create-post.dto.ts
│           └── update-post.dto.ts
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── interceptors/
│       ├── transform.interceptor.ts
│       └── logging.interceptor.ts
├── config/
│   └── database.config.ts
├── app.module.ts
└── main.ts
```

### Dependency Flow

```
Controller → Service → Repository → Database
    ↓          ↓
   DTOs     Business Logic
    ↓
Validation
```

## Development Workflow

### Git Workflow

```
main (production)
  ↓
develop (integration)
  ↓
feature/* (new features)
hotfix/* (urgent fixes)
```

### Branch Naming Convention

- `feature/user-authentication`
- `fix/post-creation-bug`
- `refactor/api-client-cleanup`
- `docs/update-readme`

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Example:**
```
feat(auth): implement JWT refresh token rotation

- Add refresh token entity
- Implement token rotation logic
- Add refresh endpoint

Closes #123
```

## Performance Optimization

### Frontend
- ✅ **Code Splitting**: Automatic with Next.js
- ✅ **Image Optimization**: next/image component
- ✅ **Font Optimization**: next/font
- ⏳ **Lazy Loading**: Dynamic imports for heavy components
- ⏳ **Caching**: SWR or React Query for client-side caching

### Backend
- ✅ **Database Indexing**: On frequently queried fields
- ⏳ **Caching**: Redis for session and frequent queries
- ⏳ **Pagination**: Cursor-based for infinite scroll
- ⏳ **Query Optimization**: Select only needed fields

### Database
- ✅ **Connection Pooling**: Reuse database connections
- ⏳ **Read Replicas**: Scale read operations
- ⏳ **Materialized Views**: For complex aggregations

## Testing Strategy

### Frontend Testing
- **Unit Tests**: Jest + React Testing Library
- **Component Tests**: Test user interactions
- **E2E Tests**: Playwright for critical user flows

### Backend Testing
- **Unit Tests**: Jest for services and utilities
- **Integration Tests**: Test API endpoints
- **E2E Tests**: Supertest for full request/response cycle

### Test Coverage Goals
- Unit Tests: >80%
- Integration Tests: All API endpoints
- E2E Tests: Critical user journeys

## Deployment Strategy

### Frontend (Vercel)
- Automatic deployments from `main` branch
- Preview deployments for PRs
- Environment variables via Vercel dashboard
- Edge caching for static assets

### Backend (Railway)
- Automatic deployments from `main` branch
- Database provisioning on Railway
- Environment variables via Railway dashboard
- Health check endpoint monitoring

### CI/CD Pipeline (GitHub Actions)
```yaml
1. Lint & Format Check
2. Type Check
3. Run Tests
4. Build Apps
5. Deploy to Staging
6. Run E2E Tests
7. Deploy to Production (manual approval)
```

## Monitoring & Logging

### Logging Strategy
- **Info**: Request/response logging
- **Warn**: Validation errors, deprecated API usage
- **Error**: Server errors, database failures

### Metrics to Track
- API response times
- Error rates
- Database query performance
- User engagement (posts, comments, likes)

## Scalability Considerations

### Horizontal Scaling
- Stateless backend servers
- Load balancer for traffic distribution
- Database read replicas

### Vertical Scaling
- Upgrade server resources as needed
- Optimize database queries
- Implement caching layer

### Future Enhancements
- Microservices architecture for high scale
- CDN for static content delivery
- Message queue for async operations (email, notifications)
- Elasticsearch for advanced search

---

This architecture is designed to be **maintainable**, **scalable**, and **developer-friendly** while following industry best practices.
