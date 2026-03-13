# Database Schema Documentation

## Overview

This document describes the PostgreSQL database schema for the blog platform. The schema is designed to support a Medium-like blogging experience with users, posts, comments, likes, and social following features.

**Database:** PostgreSQL 14+  
**ORM:** TypeORM  
**Migrations:** Enabled (TypeORM)

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                              USERS                                  │
├──────────────┬──────────────────────────────────────────────────────┤
│ id           │ UUID PRIMARY KEY                                     │
│ email        │ VARCHAR(255) UNIQUE NOT NULL                         │
│ username     │ VARCHAR(50) UNIQUE NOT NULL                          │
│ password     │ VARCHAR(255) NOT NULL (bcrypt hashed)                │
│ fullName     │ VARCHAR(100) NULL                                    │
│ bio          │ TEXT NULL                                            │
│ avatarUrl    │ VARCHAR(500) NULL                                    │
│ isEmailVerified │ BOOLEAN DEFAULT FALSE                            │
│ emailVerificationToken │ VARCHAR(255) NULL                         │
│ passwordResetToken │ VARCHAR(255) NULL                             │
│ passwordResetExpires │ TIMESTAMP NULL                               │
│ role         │ ENUM('user', 'admin') DEFAULT 'user'                 │
│ isActive     │ BOOLEAN DEFAULT TRUE                                 │
│ lastLoginAt  │ TIMESTAMP NULL                                       │
│ createdAt    │ TIMESTAMP DEFAULT NOW()                              │
│ updatedAt    │ TIMESTAMP DEFAULT NOW()                              │
└──────────────┴──────────────────────────────────────────────────────┘
                    │                          │
                    │                          │ (1:N)
                    │                          ▼
                    │              ┌────────────────────────────┐
                    │              │         POSTS              │
                    │              ├──────────┬─────────────────┤
                    │              │ id       │ UUID PK         │
                    │              │ title    │ VARCHAR(255)    │
                    │              │ subtitle │ TEXT NULL       │
                    │              │ content  │ TEXT            │
                    │              │ excerpt  │ TEXT NULL       │
                    │              │ coverImageUrl │ VARCHAR    │
                    │              │ slug     │ VARCHAR UNIQUE  │
                    │              │ status   │ ENUM            │
                    │              │ publishedAt │ TIMESTAMP    │
                    │              │ viewCount │ INT DEFAULT 0  │
                    │              │ likeCount │ INT DEFAULT 0  │
                    │              │ commentCount │ INT         │
                    │              │ readingTimeMinutes │ INT   │
                    │              │ tags     │ TEXT[]          │
                    │              │ allowComments │ BOOLEAN    │
                    │              │ authorId │ UUID FK         │
                    │              │ createdAt │ TIMESTAMP      │
                    │              │ updatedAt │ TIMESTAMP      │
                    │              └──────────┴─────────────────┘
                    │                   │             │
                    │                   │ (1:N)       │ (1:N)
                    │                   ▼             ▼
                    │      ┌────────────────┐   ┌──────────────┐
                    │      │   COMMENTS     │   │    LIKES     │
                    │      ├────────┬───────┤   ├──────┬───────┤
                    │ (1:N)│ id     │ UUID  │   │ id   │ UUID  │
                    └─────▶│ userId │ UUID FK   │ userId│UUID FK│
                           │ postId │ UUID FK───┤ postId│UUID FK│
                           │ parentId│UUID NULL │ createdAt│TS  │
                           │ content│ TEXT   │   └──────┴───────┘
                           │ likeCount│ INT  │
                           │ isEdited│ BOOL  │
                           │ isDeleted│BOOL  │
                           │ createdAt│ TS   │
                           │ updatedAt│ TS   │
                           └────────┴───────┘

┌──────────────────────────────────────────────────────────────────┐
│                         FOLLOWS                                  │
│               (Self-referencing many-to-many)                    │
├──────────────┬───────────────────────────────────────────────────┤
│ followerId   │ UUID FOREIGN KEY REFERENCES users(id)             │
│ followingId  │ UUID FOREIGN KEY REFERENCES users(id)             │
│ createdAt    │ TIMESTAMP DEFAULT NOW()                           │
│              │                                                   │
│ PRIMARY KEY (followerId, followingId)                            │
│ UNIQUE CONSTRAINT ON (followerId, followingId)                   │
└──────────────┴───────────────────────────────────────────────────┘
```

---

## Tables

### 1. `users`

**Description:** Stores user accounts and profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Unique username (3-50 chars) |
| `password` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `fullName` | VARCHAR(100) | NULL | User's full name |
| `bio` | TEXT | NULL | User biography |
| `avatarUrl` | VARCHAR(500) | NULL | Profile picture URL |
| `isEmailVerified` | BOOLEAN | DEFAULT FALSE | Email verification status |
| `emailVerificationToken` | VARCHAR(255) | NULL | Token for email verification |
| `passwordResetToken` | VARCHAR(255) | NULL | Token for password reset |
| `passwordResetExpires` | TIMESTAMP | NULL | Expiration time for reset token |
| `role` | ENUM | DEFAULT 'user' | User role (user, admin) |
| `isActive` | BOOLEAN | DEFAULT TRUE | Account active status |
| `lastLoginAt` | TIMESTAMP | NULL | Last login timestamp |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Account creation time |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes:**
- `PRIMARY KEY (id)`
- `UNIQUE INDEX ON (email)`
- `UNIQUE INDEX ON (username)`
- `INDEX ON (isActive)`
- `INDEX ON (createdAt)`

**Relationships:**
- One-to-Many with `posts` (author)
- One-to-Many with `comments` (user)
- One-to-Many with `likes` (user)
- Many-to-Many with `users` (self-referencing via `follows`)

---

### 2. `posts`

**Description:** Stores blog posts and articles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique post identifier |
| `title` | VARCHAR(255) | NOT NULL | Post title |
| `subtitle` | TEXT | NULL | Post subtitle |
| `content` | TEXT | NOT NULL | Post content (Markdown/HTML) |
| `excerpt` | TEXT | NULL | Short summary |
| `coverImageUrl` | VARCHAR(500) | NULL | Cover image URL |
| `slug` | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly slug |
| `status` | ENUM | DEFAULT 'draft' | Post status (draft/published/archived) |
| `publishedAt` | TIMESTAMP | NULL | Publication timestamp |
| `viewCount` | INTEGER | DEFAULT 0 | Number of views |
| `likeCount` | INTEGER | DEFAULT 0 | Number of likes |
| `commentCount` | INTEGER | DEFAULT 0 | Number of comments |
| `readingTimeMinutes` | INTEGER | DEFAULT 5 | Estimated reading time |
| `tags` | TEXT[] | NULL | Array of tags |
| `allowComments` | BOOLEAN | DEFAULT TRUE | Comments enabled |
| `authorId` | UUID | FOREIGN KEY, NOT NULL | Author user ID |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `PRIMARY KEY (id)`
- `UNIQUE INDEX ON (slug)`
- `INDEX ON (authorId, status)`
- `INDEX ON (status, publishedAt)`
- `INDEX ON (publishedAt DESC)` (for feed queries)
- `INDEX ON (likeCount DESC)` (for popular posts)
- `INDEX ON (viewCount DESC)` (for trending posts)
- `GIN INDEX ON (tags)` (for tag searches)

**Relationships:**
- Many-to-One with `users` (author)
- One-to-Many with `comments`
- One-to-Many with `likes`

**Constraints:**
- `CHECK (readingTimeMinutes >= 1)`
- `CHECK (viewCount >= 0)`
- `CHECK (likeCount >= 0)`
- `CHECK (commentCount >= 0)`

---

### 3. `comments`

**Description:** Stores comments on posts (supports nested replies).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique comment identifier |
| `content` | TEXT | NOT NULL | Comment content |
| `postId` | UUID | FOREIGN KEY, NOT NULL | Post being commented on |
| `userId` | UUID | FOREIGN KEY, NOT NULL | Comment author |
| `parentId` | UUID | FOREIGN KEY, NULL | Parent comment (for replies) |
| `likeCount` | INTEGER | DEFAULT 0 | Number of likes |
| `isEdited` | BOOLEAN | DEFAULT FALSE | Comment has been edited |
| `isDeleted` | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `PRIMARY KEY (id)`
- `INDEX ON (postId, createdAt)`
- `INDEX ON (userId)`
- `INDEX ON (parentId)`
- `INDEX ON (postId, parentId, createdAt)` (for threaded comments)

**Relationships:**
- Many-to-One with `posts` (post)
- Many-to-One with `users` (user)
- Many-to-One with `comments` (parent) - self-referencing
- One-to-Many with `comments` (replies) - self-referencing

**Constraints:**
- `CHECK (likeCount >= 0)`
- `ON DELETE CASCADE` on `postId` and `userId`

**Special Features:**
- Uses TypeORM's Closure Table pattern for nested comments
- Supports infinite nesting depth
- Efficient queries for comment trees

---

### 4. `likes`

**Description:** Stores likes on posts (simple many-to-many join table).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique like identifier |
| `userId` | UUID | FOREIGN KEY, NOT NULL | User who liked |
| `postId` | UUID | FOREIGN KEY, NOT NULL | Post that was liked |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Like timestamp |

**Indexes:**
- `PRIMARY KEY (id)`
- `UNIQUE INDEX ON (userId, postId)` (prevent duplicate likes)
- `INDEX ON (postId, createdAt)` (for recent likes)
- `INDEX ON (userId)` (for user's liked posts)

**Relationships:**
- Many-to-One with `users` (user)
- Many-to-One with `posts` (post)

**Constraints:**
- `UNIQUE (userId, postId)` - One like per user per post
- `ON DELETE CASCADE` on both foreign keys

---

### 5. `follows`

**Description:** Self-referencing many-to-many relationship for user follows.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `followerId` | UUID | FOREIGN KEY, NOT NULL | User who follows |
| `followingId` | UUID | FOREIGN KEY, NOT NULL | User being followed |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Follow timestamp |

**Indexes:**
- `PRIMARY KEY (followerId, followingId)`
- `INDEX ON (followerId)` (for "following" list)
- `INDEX ON (followingId)` (for "followers" list)
- `INDEX ON (followerId, createdAt)` (for recent follows)

**Relationships:**
- Many-to-One with `users` (follower)
- Many-to-One with `users` (following)

**Constraints:**
- `UNIQUE (followerId, followingId)` - Can't follow same user twice
- `CHECK (followerId != followingId)` - Can't follow yourself
- `ON DELETE CASCADE` on both foreign keys

---

## Enums

### PostStatus

```sql
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');
```

**Values:**
- `draft`: Post is saved but not published
- `published`: Post is publicly visible
- `archived`: Post is hidden from public view

### UserRole

```sql
CREATE TYPE user_role AS ENUM ('user', 'admin');
```

**Values:**
- `user`: Regular user account
- `admin`: Administrative account with elevated privileges

---

## Sample Queries

### Get User's Feed (Following + Own Posts)

```sql
SELECT p.*, u.username, u.avatarUrl
FROM posts p
JOIN users u ON p.authorId = u.id
WHERE (
  p.authorId IN (
    SELECT followingId FROM follows WHERE followerId = :currentUserId
  )
  OR p.authorId = :currentUserId
)
AND p.status = 'published'
ORDER BY p.publishedAt DESC
LIMIT 10 OFFSET 0;
```

### Get Post with Like Status for Current User

```sql
SELECT 
  p.*,
  u.username,
  u.avatarUrl,
  EXISTS(
    SELECT 1 FROM likes 
    WHERE userId = :currentUserId AND postId = p.id
  ) AS isLiked
FROM posts p
JOIN users u ON p.authorId = u.id
WHERE p.id = :postId;
```

### Get Comment Tree for Post

```sql
WITH RECURSIVE comment_tree AS (
  -- Root comments
  SELECT c.*, u.username, u.avatarUrl, 0 AS depth
  FROM comments c
  JOIN users u ON c.userId = u.id
  WHERE c.postId = :postId AND c.parentId IS NULL
  
  UNION ALL
  
  -- Replies
  SELECT c.*, u.username, u.avatarUrl, ct.depth + 1
  FROM comments c
  JOIN users u ON c.userId = u.id
  JOIN comment_tree ct ON c.parentId = ct.id
  WHERE c.postId = :postId
)
SELECT * FROM comment_tree
ORDER BY depth, createdAt;
```

### Get User Statistics

```sql
SELECT 
  u.*,
  (SELECT COUNT(*) FROM posts WHERE authorId = u.id AND status = 'published') AS postsCount,
  (SELECT COUNT(*) FROM follows WHERE followingId = u.id) AS followersCount,
  (SELECT COUNT(*) FROM follows WHERE followerId = u.id) AS followingCount
FROM users u
WHERE u.id = :userId;
```

### Get Trending Posts (Last 7 Days)

```sql
SELECT p.*, u.username, u.avatarUrl,
  (p.viewCount * 1.0 + p.likeCount * 5.0 + p.commentCount * 3.0) AS trendingScore
FROM posts p
JOIN users u ON p.authorId = u.id
WHERE p.status = 'published'
  AND p.publishedAt >= NOW() - INTERVAL '7 days'
ORDER BY trendingScore DESC
LIMIT 10;
```

### Search Posts by Tag

```sql
SELECT p.*, u.username
FROM posts p
JOIN users u ON p.authorId = u.id
WHERE p.status = 'published'
  AND p.tags @> ARRAY['javascript']::text[]
ORDER BY p.publishedAt DESC;
```

---

## Data Integrity Rules

### Cascading Deletes

When a user is deleted:
- ✅ All their posts are deleted
- ✅ All their comments are deleted
- ✅ All their likes are deleted
- ✅ All follow relationships are deleted

When a post is deleted:
- ✅ All comments on that post are deleted
- ✅ All likes on that post are deleted

When a comment is deleted:
- ⚠️ Soft delete: `isDeleted` flag set to `true`
- ✅ Replies remain visible (with parent showing as "[deleted]")

### Unique Constraints

- User email and username must be unique
- Post slug must be unique
- One like per user per post
- One follow relationship per user pair

### Check Constraints

- Counters (viewCount, likeCount, etc.) cannot be negative
- Reading time must be at least 1 minute
- Users cannot follow themselves

---

## Performance Optimizations

### Denormalized Counters

The following fields are denormalized for performance:
- `posts.likeCount` - Updated via trigger/application when likes added/removed
- `posts.commentCount` - Updated when comments added/deleted
- `posts.viewCount` - Incremented on each view (async update recommended)
- `comments.likeCount` - Updated when comment likes change

**Trade-off:** Slight data redundancy for faster queries (no COUNT(*) needed)

### Recommended Indexes

Already documented in each table section above. Key indexes:
- Compound index on `(authorId, status)` for user's posts
- Compound index on `(status, publishedAt)` for published posts feed
- GIN index on `tags` array for tag searches
- Indexes on foreign keys for join performance

### Partitioning Strategy (Future)

For high-scale deployments, consider:
- Partitioning `posts` table by `publishedAt` (monthly partitions)
- Partitioning `comments` table by `createdAt`
- Archiving old posts to separate tables/database

---

## Migrations

### Initial Migration

```typescript
// TypeORM migration will auto-generate from entities
// Run: pnpm run migration:generate -- -n InitialSchema
// Run: pnpm run migration:run
```

### Migration Best Practices

1. Never modify existing migrations
2. Always test migrations on staging first
3. Create rollback migrations for destructive changes
4. Back up database before running migrations in production
5. Use transactions for multi-step migrations

---

## Security Considerations

### Password Storage

- Passwords are hashed using bcrypt with salt rounds (10+)
- Never store plain text passwords
- Password reset tokens are hashed and expire after 1 hour

### Data Sanitization

- All user input is validated and sanitized
- HTML content is sanitized to prevent XSS
- SQL injection prevented by TypeORM's parameterized queries

### Access Control

- Users can only edit/delete their own posts and comments
- Admins can moderate any content
- Draft posts are only visible to the author
- Soft-deleted comments preserve user privacy

---

## Backup Strategy

### Recommended Schedule

- **Full backup:** Daily at 2 AM UTC
- **Incremental backup:** Every 6 hours
- **Point-in-Time Recovery:** Enabled with WAL archiving
- **Retention:** 30 days for backups

### Critical Tables

Priority order for restore:
1. `users` - User accounts
2. `posts` - Blog content
3. `follows` - Social graph
4. `comments` - User engagement
5. `likes` - User engagement

---

**Last Updated:** March 13, 2026  
**Schema Version:** 1.0.0
