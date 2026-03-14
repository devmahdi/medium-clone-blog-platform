# Frontend API Setup Guide

This guide explains how to configure and use the API client in the frontend.

## Quick Start

### 1. Environment Variables

Create `.env.local` in `apps/frontend/`:

```bash
# Copy the example file
cp apps/frontend/.env.example apps/frontend/.env.local

# Edit the API URL
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" > apps/frontend/.env.local
```

### 2. Start Backend First

```bash
cd apps/backend
npm install
npm run start:dev
```

Backend will run on http://localhost:3001

### 3. Start Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

Frontend will run on http://localhost:3000

---

## API Client Usage

The API client is located at `apps/frontend/src/lib/api.ts`.

### Importing

```typescript
import {
  authApi,
  usersApi,
  feedApi,
  commentsApi,
  clapsApi,
  bookmarksApi,
  articlesApi,
  tagsApi,
  mediaApi,
  adminApi,
  isAuthenticated,
  getCurrentUser,
  isAdmin,
  logout,
} from '@/lib/api';
```

---

## ✅ Available APIs

### Authentication

```typescript
// Register
const { user, accessToken, refreshToken } = await authApi.register({
  email: 'user@example.com',
  username: 'johndoe',
  password: 'password123',
  fullName: 'John Doe', // optional
});

// Login
const { user, accessToken, refreshToken } = await authApi.login({
  identifier: 'user@example.com', // or username
  password: 'password123',
});

// Logout
await authApi.logout();

// Change password
await authApi.changePassword({
  currentPassword: 'old',
  newPassword: 'new',
});
```

### Users

```typescript
// Get profile
const profile = await usersApi.getProfile('johndoe'); // username or userId

// Update profile
await usersApi.updateProfile({
  fullName: 'John Doe',
  bio: 'Software developer',
  avatarUrl: 'https://example.com/avatar.jpg',
  socialLinks: {
    twitter: 'https://twitter.com/johndoe',
    github: 'https://github.com/johndoe',
  },
});

// Follow user
await usersApi.followUser(userId);

// Unfollow user
await usersApi.unfollowUser(userId);

// Get followers
const { data, meta } = await usersApi.getFollowers(userId, page, limit);

// Get following
const { data, meta } = await usersApi.getFollowing(userId, page, limit);
```

### Feed ✅ NEW

```typescript
// Get personalized feed (requires auth)
const { data, meta } = await feedApi.getPersonalized({
  page: 1,
  limit: 20,
  tag: 'javascript', // optional
  dateFrom: '2024-01-01T00:00:00.000Z', // optional
  dateTo: '2024-12-31T23:59:59.999Z', // optional
});

// Get explore feed (public)
const { data, meta } = await feedApi.getExplore({
  page: 1,
  limit: 20,
  sortBy: 'trending', // 'recent' | 'popular' | 'trending'
  tag: 'javascript', // optional
});
```

### Comments ✅ UPDATED

```typescript
// Get comments for article (nested tree)
const { comments, total } = await commentsApi.getByArticle(articleId);

// Create comment
const comment = await commentsApi.create(articleId, 'Great article!');

// Reply to comment
const reply = await commentsApi.reply(commentId, 'I agree!');

// Update comment
const updated = await commentsApi.update(commentId, 'Updated content');

// Delete comment (soft delete)
await commentsApi.delete(commentId);
```

### Claps ✅ UPDATED

```typescript
// Add claps (1-50 per user per article)
const { userClaps, totalClaps, added, message } = await clapsApi.add(
  articleId,
  5, // add 5 claps
);

// Get clap counts
const { totalClaps, userClaps, maxClaps, canClap } = await clapsApi.getCount(
  articleId,
);
```

### Bookmarks ✅ UPDATED

```typescript
// Get bookmarked articles
const { data, meta } = await bookmarksApi.getAll(page, limit);

// Bookmark article
await bookmarksApi.add(articleId);

// Remove bookmark
await bookmarksApi.remove(articleId);

// Check if bookmarked
const isBookmarked = await bookmarksApi.isBookmarked(articleId);
```

### Media

```typescript
// Upload avatar
const { url, key } = await mediaApi.uploadAvatar(file);

// Upload cover image
const { url, key } = await mediaApi.uploadCover(file);

// Upload content image
const { url, key } = await mediaApi.uploadContent(file);

// Delete file
await mediaApi.delete(fileKey);
```

---

## ⚠️ NOT YET IMPLEMENTED (Backend Missing)

### Articles ❌

```typescript
// NOTE: These will fail - Articles module not implemented in backend
const { data, meta } = await articlesApi.getAll({ page: 1, limit: 20 });
const article = await articlesApi.getBySlug('article-slug');
await articlesApi.create({ title: 'Title', content: 'Content' });
await articlesApi.update('slug', { title: 'New Title' });
await articlesApi.delete('slug');
const { data, meta } = await articlesApi.search('query');
```

**Workaround:** Use Feed API for listing articles

### Tags ❌

```typescript
// NOTE: These will fail - Tags module not implemented in backend
const tags = await tagsApi.getTrending(10);
const { data, meta } = await tagsApi.getAll({ page: 1, limit: 20 });
```

**Workaround:** Tags stored as string array in articles, use Feed API with tag filter

### Stats ❌

```typescript
// NOTE: These will fail - Stats module not implemented in backend
const stats = await statsApi.getOverview();
const growth = await statsApi.getGrowth('month');
```

**Workaround:** Admin dashboard shows placeholder data

---

## Error Handling

The API client automatically handles:

### 1. Authentication Errors (401)
- Automatically attempts token refresh
- Redirects to `/login` if refresh fails
- Clears localStorage

### 2. API Errors
All API methods throw `ApiError` with:
```typescript
{
  status: number;     // HTTP status code
  message: string;    // Error message
  errors?: any;       // Validation errors (if any)
}
```

### Usage Example

```typescript
try {
  const article = await articlesApi.getBySlug('my-article');
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.status}: ${error.message}`);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
  }
}
```

---

## Helper Functions

### Check Authentication

```typescript
import { isAuthenticated, getCurrentUser, isAdmin } from '@/lib/api';

// Check if user is logged in
if (isAuthenticated()) {
  // User is authenticated
}

// Get current user info
const user = getCurrentUser();
// Returns: { id, email, username, role } or null

// Check if user is admin
if (isAdmin()) {
  // User has admin privileges
}
```

### Logout

```typescript
import { logout } from '@/lib/api';

// Logout (clears localStorage and redirects to /login)
logout();
```

---

## Component Examples

### Using in React Components

```typescript
'use client';

import { useEffect, useState } from 'react';
import { feedApi, type Article } from '@/lib/api';

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeed() {
      try {
        const { data } = await feedApi.getExplore({
          page: 1,
          limit: 10,
          sortBy: 'trending',
        });
        setArticles(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {articles.map((article) => (
        <div key={article.id}>
          <h2>{article.title}</h2>
          <p>{article.excerpt}</p>
        </div>
      ))}
    </div>
  );
}
```

### Server-Side Rendering (SSR)

```typescript
import { feedApi } from '@/lib/api';

export default async function HomePage() {
  const { data: articles } = await feedApi.getExplore({
    page: 1,
    limit: 10,
    sortBy: 'recent',
  });

  return (
    <div>
      {articles.map((article) => (
        <div key={article.id}>
          <h2>{article.title}</h2>
        </div>
      ))}
    </div>
  );
}
```

**Note:** SSR requires backend to handle requests from server (not browser)

---

## Testing API Endpoints

### Using curl

```bash
# Get explore feed
curl http://localhost:3001/api/v1/feed/explore

# Get personalized feed (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/v1/feed/personalized

# Create comment
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Great article!"}' \
  http://localhost:3001/api/v1/comments/articles/ARTICLE_ID
```

### Using Swagger

Open http://localhost:3001/api/docs for interactive API documentation

---

## Troubleshooting

### CORS Issues

If you see CORS errors:

1. Check `CORS_ORIGIN` in backend `.env`:
   ```env
   CORS_ORIGIN=http://localhost:3000
   ```

2. Restart backend after changing `.env`

### 401 Unauthorized

If all API calls return 401:

1. Check token in localStorage (DevTools → Application → Local Storage)
2. Try logging out and logging back in
3. Check backend logs for JWT errors

### Connection Refused

If API calls fail with connection errors:

1. Verify backend is running: `curl http://localhost:3001/health`
2. Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
3. Verify port 3001 is not blocked by firewall

---

## Production Deployment

### Environment Variables

**Vercel (Frontend):**
```env
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api/v1
```

**Railway (Backend):**
```env
CORS_ORIGIN=https://your-app.vercel.app
```

### Testing

After deployment, test API connectivity:

```bash
# Test from frontend
curl https://your-app.vercel.app

# Test backend directly
curl https://your-backend.up.railway.app/api/v1/feed/explore
```

---

## See Also

- [API Integration Status](./API_INTEGRATION_STATUS.md) - Complete integration status
- [Backend Deployment](./RAILWAY_QUICK_START.md) - Railway setup guide
- [Frontend Deployment](./VERCEL_QUICK_START.md) - Vercel setup guide
- [API Specification](./API_SPECIFICATION.md) - Full endpoint documentation
