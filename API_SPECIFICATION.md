# Blog Platform API Specification

**Version:** 1.0.0  
**Base URL:** `http://localhost:3001/api/v1`  
**Authentication:** JWT Bearer Token

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Posts](#posts)
4. [Comments](#comments)
5. [Likes](#likes)
6. [Follows](#follows)
7. [Data Models](#data-models)
8. [Error Responses](#error-responses)

---

## Authentication

### Register

Create a new user account.

**Endpoint:** `POST /auth/register`  
**Public Access**

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "username": "johndoe",
  "password": "SecureP@ss123",
  "fullName": "John Doe"
}
```

**Validation Rules:**
- `email`: Valid email format, unique
- `username`: 3-50 characters, alphanumeric + underscores, unique
- `password`: Min 8 characters, must include uppercase, lowercase, number, special character
- `fullName`: Optional, max 100 characters

**Response:** `201 Created`
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "fullName": "John Doe",
      "bio": null,
      "avatarUrl": null,
      "createdAt": "2026-03-13T21:30:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

**Errors:**
- `400` - Validation failed (email/username already exists)
- `500` - Internal server error

---

### Login

Authenticate and receive access tokens.

**Endpoint:** `POST /auth/login`  
**Public Access**

**Request Body:**
```json
{
  "identifier": "johndoe",
  "password": "SecureP@ss123"
}
```

**Notes:**
- `identifier` can be either email or username

**Response:** `200 OK`
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "fullName": "John Doe",
      "avatarUrl": null,
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

**Errors:**
- `401` - Invalid credentials
- `403` - Account not active

---

### Refresh Token

Get a new access token using refresh token.

**Endpoint:** `POST /auth/refresh`  
**Public Access**

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

**Errors:**
- `401` - Invalid or expired refresh token

---

### Get Profile

Get authenticated user's profile.

**Endpoint:** `GET /auth/profile`  
**Authentication Required**

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "fullName": "John Doe",
    "bio": "Passionate writer and developer",
    "avatarUrl": "https://example.com/avatar.jpg",
    "isEmailVerified": true,
    "role": "user",
    "followersCount": 150,
    "followingCount": 80,
    "postsCount": 25,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-03-13T21:30:00.000Z"
  }
}
```

---

### Logout

Invalidate current session/token.

**Endpoint:** `POST /auth/logout`  
**Authentication Required**

**Response:** `200 OK`
```json
{
  "message": "Successfully logged out"
}
```

---

## Users

### Get User by ID/Username

Retrieve a specific user's public profile.

**Endpoint:** `GET /users/:identifier`  
**Public Access**

**Parameters:**
- `identifier`: User ID (UUID) or username (string)

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "fullName": "John Doe",
    "bio": "Passionate writer and developer",
    "avatarUrl": "https://example.com/avatar.jpg",
    "followersCount": 150,
    "followingCount": 80,
    "postsCount": 25,
    "isFollowing": false,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- `404` - User not found

---

### Update Profile

Update authenticated user's profile.

**Endpoint:** `PATCH /users/me`  
**Authentication Required**

**Request Body:**
```json
{
  "fullName": "John M. Doe",
  "bio": "Updated bio text",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "fullName": "John M. Doe",
    "bio": "Updated bio text",
    "avatarUrl": "https://example.com/new-avatar.jpg",
    "updatedAt": "2026-03-13T21:35:00.000Z"
  }
}
```

---

### Get User's Posts

Retrieve all posts by a specific user.

**Endpoint:** `GET /users/:identifier/posts`  
**Public Access**

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)
- `status` (optional): Filter by status (published/draft/archived)
- `sortBy` (optional): Sort field (createdAt/publishedAt/viewCount/likeCount)
- `order` (optional): Sort order (asc/desc, default: desc)

**Example:** `GET /users/johndoe/posts?page=1&limit=10&status=published&sortBy=publishedAt`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "The Future of Web Development",
      "subtitle": "Exploring trends",
      "excerpt": "A brief overview...",
      "slug": "future-of-web-development",
      "coverImageUrl": "https://example.com/cover.jpg",
      "status": "published",
      "publishedAt": "2026-03-10T10:00:00.000Z",
      "viewCount": 1250,
      "likeCount": 45,
      "commentCount": 12,
      "readingTimeMinutes": 5,
      "tags": ["web-development", "javascript"],
      "author": {
        "id": "uuid",
        "username": "johndoe",
        "fullName": "John Doe",
        "avatarUrl": "https://example.com/avatar.jpg"
      },
      "createdAt": "2026-03-10T09:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

### Get User's Followers

Get list of users following this user.

**Endpoint:** `GET /users/:identifier/followers`  
**Public Access**

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "username": "janedoe",
      "fullName": "Jane Doe",
      "avatarUrl": "https://example.com/jane.jpg",
      "bio": "Tech enthusiast",
      "followersCount": 200,
      "isFollowing": true,
      "followedAt": "2026-02-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

---

### Get User's Following

Get list of users this user is following.

**Endpoint:** `GET /users/:identifier/following`  
**Public Access**

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:** Same format as followers endpoint

---

### Follow User

Follow a user.

**Endpoint:** `POST /users/:identifier/follow`  
**Authentication Required**

**Response:** `200 OK`
```json
{
  "data": {
    "userId": "uuid",
    "username": "johndoe",
    "isFollowing": true,
    "followersCount": 151
  }
}
```

**Errors:**
- `400` - Cannot follow yourself
- `404` - User not found
- `409` - Already following this user

---

### Unfollow User

Unfollow a user.

**Endpoint:** `DELETE /users/:identifier/follow`  
**Authentication Required**

**Response:** `200 OK`
```json
{
  "data": {
    "userId": "uuid",
    "username": "johndoe",
    "isFollowing": false,
    "followersCount": 150
  }
}
```

---

## Posts

### Create Post

Create a new blog post.

**Endpoint:** `POST /posts`  
**Authentication Required**

**Request Body:**
```json
{
  "title": "The Future of Web Development in 2026",
  "subtitle": "Exploring the latest trends",
  "content": "# Introduction\n\nThis is my blog post content...",
  "excerpt": "A brief overview of web development trends",
  "coverImageUrl": "https://example.com/cover.jpg",
  "status": "draft",
  "tags": ["web-development", "javascript", "nextjs"],
  "allowComments": true
}
```

**Notes:**
- Slug is auto-generated from title
- Reading time is auto-calculated from content
- Default status is "draft"

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "title": "The Future of Web Development in 2026",
    "subtitle": "Exploring the latest trends",
    "slug": "future-of-web-development-2026",
    "content": "# Introduction...",
    "excerpt": "A brief overview...",
    "coverImageUrl": "https://example.com/cover.jpg",
    "status": "draft",
    "publishedAt": null,
    "viewCount": 0,
    "likeCount": 0,
    "commentCount": 0,
    "readingTimeMinutes": 5,
    "tags": ["web-development", "javascript", "nextjs"],
    "allowComments": true,
    "authorId": "uuid",
    "createdAt": "2026-03-13T21:40:00.000Z",
    "updatedAt": "2026-03-13T21:40:00.000Z"
  }
}
```

**Errors:**
- `400` - Validation failed
- `409` - Post with similar slug already exists

---

### Get All Posts

Retrieve a paginated list of published posts (feed).

**Endpoint:** `GET /posts`  
**Public Access**

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)
- `sortBy` (optional): Sort field (publishedAt/viewCount/likeCount/createdAt)
- `order` (optional): Sort order (asc/desc, default: desc)
- `tags` (optional): Filter by tags (comma-separated)
- `search` (optional): Search in title/subtitle/content
- `authorId` (optional): Filter by author UUID

**Example:** `GET /posts?page=1&limit=10&sortBy=likeCount&tags=javascript,nextjs`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "The Future of Web Development",
      "subtitle": "Exploring trends",
      "excerpt": "A brief overview...",
      "slug": "future-of-web-development",
      "coverImageUrl": "https://example.com/cover.jpg",
      "status": "published",
      "publishedAt": "2026-03-10T10:00:00.000Z",
      "viewCount": 1250,
      "likeCount": 45,
      "commentCount": 12,
      "readingTimeMinutes": 5,
      "tags": ["web-development", "javascript"],
      "author": {
        "id": "uuid",
        "username": "johndoe",
        "fullName": "John Doe",
        "avatarUrl": "https://example.com/avatar.jpg"
      },
      "isLiked": false,
      "createdAt": "2026-03-10T09:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

---

### Get Post by ID or Slug

Retrieve a single post.

**Endpoint:** `GET /posts/:identifier`  
**Public Access** (for published posts)  
**Authentication Required** (for draft posts - author only)

**Parameters:**
- `identifier`: Post ID (UUID) or slug (string)

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "title": "The Future of Web Development",
    "subtitle": "Exploring trends",
    "content": "# Introduction\n\nFull content here...",
    "excerpt": "A brief overview...",
    "slug": "future-of-web-development",
    "coverImageUrl": "https://example.com/cover.jpg",
    "status": "published",
    "publishedAt": "2026-03-10T10:00:00.000Z",
    "viewCount": 1251,
    "likeCount": 45,
    "commentCount": 12,
    "readingTimeMinutes": 5,
    "tags": ["web-development", "javascript"],
    "allowComments": true,
    "author": {
      "id": "uuid",
      "username": "johndoe",
      "fullName": "John Doe",
      "avatarUrl": "https://example.com/avatar.jpg",
      "bio": "Passionate writer",
      "followersCount": 150
    },
    "isLiked": false,
    "createdAt": "2026-03-10T09:00:00.000Z",
    "updatedAt": "2026-03-10T09:00:00.000Z"
  }
}
```

**Notes:**
- View count is incremented on each GET request
- `isLiked` indicates if current user (if authenticated) liked this post

**Errors:**
- `404` - Post not found
- `403` - Not authorized to view draft post

---

### Update Post

Update an existing post.

**Endpoint:** `PATCH /posts/:id`  
**Authentication Required** (author or admin only)

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "status": "published",
  "tags": ["updated-tag"]
}
```

**Notes:**
- Can update any field from CreatePostDto
- Changing status to "published" sets publishedAt to current time
- Slug is regenerated if title changes

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "title": "Updated Title",
    "status": "published",
    "publishedAt": "2026-03-13T21:50:00.000Z",
    "updatedAt": "2026-03-13T21:50:00.000Z"
  }
}
```

**Errors:**
- `403` - Not authorized (not the author)
- `404` - Post not found

---

### Delete Post

Delete a post permanently.

**Endpoint:** `DELETE /posts/:id`  
**Authentication Required** (author or admin only)

**Response:** `200 OK`
```json
{
  "message": "Post deleted successfully"
}
```

**Errors:**
- `403` - Not authorized
- `404` - Post not found

---

### Like Post

Like a post.

**Endpoint:** `POST /posts/:id/like`  
**Authentication Required**

**Response:** `200 OK`
```json
{
  "data": {
    "postId": "uuid",
    "isLiked": true,
    "likeCount": 46
  }
}
```

**Notes:**
- Idempotent: liking an already-liked post returns success without duplicate

**Errors:**
- `404` - Post not found

---

### Unlike Post

Remove like from a post.

**Endpoint:** `DELETE /posts/:id/like`  
**Authentication Required**

**Response:** `200 OK`
```json
{
  "data": {
    "postId": "uuid",
    "isLiked": false,
    "likeCount": 45
  }
}
```

---

### Get Post Likes

Get users who liked a post.

**Endpoint:** `GET /posts/:id/likes`  
**Public Access**

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page (default: 20)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "username": "janedoe",
      "fullName": "Jane Doe",
      "avatarUrl": "https://example.com/jane.jpg",
      "likedAt": "2026-03-12T15:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

---

## Comments

### Get Post Comments

Retrieve all comments for a post.

**Endpoint:** `GET /posts/:id/comments`  
**Public Access**

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Sort field (createdAt/likeCount)
- `order` (optional): Sort order (asc/desc, default: desc)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Great article! Really enjoyed reading this.",
      "postId": "uuid",
      "userId": "uuid",
      "parentId": null,
      "likeCount": 5,
      "isEdited": false,
      "user": {
        "id": "uuid",
        "username": "janedoe",
        "fullName": "Jane Doe",
        "avatarUrl": "https://example.com/jane.jpg"
      },
      "replies": [
        {
          "id": "uuid",
          "content": "Thanks! Glad you found it useful.",
          "parentId": "parent-uuid",
          "likeCount": 2,
          "user": {
            "id": "uuid",
            "username": "johndoe",
            "fullName": "John Doe",
            "avatarUrl": "https://example.com/john.jpg"
          },
          "createdAt": "2026-03-11T11:00:00.000Z"
        }
      ],
      "repliesCount": 1,
      "canEdit": false,
      "canDelete": false,
      "createdAt": "2026-03-11T10:30:00.000Z",
      "updatedAt": "2026-03-11T10:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 12
  }
}
```

---

### Create Comment

Add a comment to a post.

**Endpoint:** `POST /posts/:id/comments`  
**Authentication Required**

**Request Body:**
```json
{
  "content": "Great article! Really enjoyed reading this.",
  "parentId": null
}
```

**Notes:**
- `parentId` is optional (null for top-level comments, UUID for replies)
- Content is sanitized to prevent XSS

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "content": "Great article! Really enjoyed reading this.",
    "postId": "uuid",
    "userId": "uuid",
    "parentId": null,
    "likeCount": 0,
    "isEdited": false,
    "user": {
      "id": "uuid",
      "username": "janedoe",
      "fullName": "Jane Doe",
      "avatarUrl": "https://example.com/jane.jpg"
    },
    "createdAt": "2026-03-13T22:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Content validation failed
- `403` - Comments disabled on this post
- `404` - Post or parent comment not found

---

### Update Comment

Edit a comment.

**Endpoint:** `PATCH /comments/:id`  
**Authentication Required** (author only)

**Request Body:**
```json
{
  "content": "Updated comment text"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "content": "Updated comment text",
    "isEdited": true,
    "updatedAt": "2026-03-13T22:05:00.000Z"
  }
}
```

**Errors:**
- `403` - Not authorized
- `404` - Comment not found

---

### Delete Comment

Delete a comment.

**Endpoint:** `DELETE /comments/:id`  
**Authentication Required** (author, post author, or admin)

**Notes:**
- Soft delete: Sets `isDeleted` flag to true, content replaced with "[deleted]"
- Child comments (replies) remain visible

**Response:** `200 OK`
```json
{
  "message": "Comment deleted successfully"
}
```

---

## Likes

### Get User's Liked Posts

Get all posts liked by a user.

**Endpoint:** `GET /users/:identifier/likes`  
**Public Access**

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Interesting Article",
      "slug": "interesting-article",
      "excerpt": "Brief description...",
      "author": {
        "username": "someauthor",
        "avatarUrl": "https://example.com/author.jpg"
      },
      "likedAt": "2026-03-12T15:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

---

## Follows

### Check Follow Status

Check if user A follows user B.

**Endpoint:** `GET /users/:userIdA/follows/:userIdB`  
**Public Access**

**Response:** `200 OK`
```json
{
  "data": {
    "isFollowing": true,
    "followedAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

## Data Models

### User Model

```typescript
{
  id: string (UUID)
  email: string (unique)
  username: string (unique, 3-50 chars)
  fullName: string | null (max 100 chars)
  bio: string | null (text)
  avatarUrl: string | null
  isEmailVerified: boolean
  role: 'user' | 'admin'
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
  
  // Virtual fields (not in DB)
  followersCount?: number
  followingCount?: number
  postsCount?: number
  isFollowing?: boolean
}
```

### Post Model

```typescript
{
  id: string (UUID)
  title: string (max 255 chars)
  subtitle: string | null (max 500 chars)
  content: string (text)
  excerpt: string | null (max 500 chars)
  coverImageUrl: string | null
  slug: string (unique, auto-generated)
  status: 'draft' | 'published' | 'archived'
  publishedAt: Date | null
  viewCount: number
  likeCount: number
  commentCount: number
  readingTimeMinutes: number
  tags: string[] | null
  allowComments: boolean
  authorId: string (UUID)
  createdAt: Date
  updatedAt: Date
  
  // Virtual fields
  isLiked?: boolean
  author?: User
}
```

### Comment Model

```typescript
{
  id: string (UUID)
  content: string (text)
  postId: string (UUID)
  userId: string (UUID)
  parentId: string | null (UUID)
  likeCount: number
  isEdited: boolean
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
  
  // Virtual fields
  user?: User
  replies?: Comment[]
  repliesCount?: number
  canEdit?: boolean
  canDelete?: boolean
}
```

### Like Model

```typescript
{
  id: string (UUID)
  userId: string (UUID)
  postId: string (UUID)
  createdAt: Date
}
```

---

## Error Responses

### Standard Error Format

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "email",
        "message": "Email is already in use"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-03-13T22:10:00.000Z",
    "path": "/api/v1/auth/register"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation failed, invalid input |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (duplicate) |
| 422 | Unprocessable Entity | Semantic validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_REQUIRED` | Missing or invalid auth token |
| `FORBIDDEN` | Not authorized for this action |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_ENTRY` | Unique constraint violation |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Unexpected server error |

---

## Rate Limiting

**Limits:**
- Authentication endpoints: 5 requests per minute
- Read endpoints (GET): 100 requests per minute
- Write endpoints (POST/PATCH/DELETE): 30 requests per minute

**Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Timestamp when limit resets

**Example:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1709503860
```

---

## Pagination

All list endpoints support pagination with consistent query parameters:

**Query Parameters:**
- `page`: Page number (starts at 1)
- `limit`: Items per page (default varies by endpoint, max 100)

**Response Meta:**
```json
{
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## Sorting & Filtering

**Sorting:**
- `sortBy`: Field to sort by
- `order`: `asc` or `desc`

**Filtering:**
- Varies by endpoint
- Common filters: `status`, `tags`, `search`, `authorId`

**Example:**
```
GET /posts?sortBy=likeCount&order=desc&tags=javascript,react&search=tutorial
```

---

## Authentication Flow

1. **Register/Login** → Receive `accessToken` and `refreshToken`
2. **Store tokens** securely (httpOnly cookie recommended)
3. **Include access token** in Authorization header:
   ```
   Authorization: Bearer {accessToken}
   ```
4. **Access token expires** (15 minutes) → Use refresh token to get new access token:
   ```
   POST /auth/refresh
   { "refreshToken": "..." }
   ```
5. **Refresh token expires** (7 days) → User must log in again

---

## Best Practices

### Security
- Always use HTTPS in production
- Store tokens securely (httpOnly cookies)
- Never expose sensitive data in URLs
- Validate and sanitize all user input
- Implement CSRF protection for cookie-based auth

### Performance
- Use pagination for large datasets
- Cache frequently accessed resources
- Minimize payload size (only request needed fields)
- Use conditional requests (ETag, If-Modified-Since)

### API Usage
- Handle errors gracefully
- Respect rate limits
- Use appropriate HTTP methods
- Include proper Content-Type headers
- Version your API requests

---

**Last Updated:** March 13, 2026  
**API Version:** 1.0.0
