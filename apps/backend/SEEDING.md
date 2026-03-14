# Database Seeding Guide

This guide explains how to populate the database with realistic sample data for development and testing.

## Overview

The seed script (`src/database/seeds/seed.ts`) creates:

- **10-15 users** with different roles (READER, AUTHOR, ADMIN)
- **20-30 articles** (mix of published, draft, archived)
- **50+ comments** (including nested replies up to 3 levels deep)
- **Random claps** distributed across articles
- **Random bookmarks** for users
- **Follow relationships** between users
- **Realistic data** using faker.js

## Quick Start

### Prerequisites

1. PostgreSQL database running
2. Environment variables configured in `.env`
3. Database schema synchronized (`npm run start:dev` will auto-sync in development)

### Run the Seed Script

```bash
# Install dependencies first
npm install

# Run the seed script
npm run seed

# Or in development mode
npm run seed:dev
```

## What Gets Created

### Users (10-15 total)

**1 Admin User:**
- Email: `admin@example.com`
- Username: `admin`
- Password: `password123`
- Role: `ADMIN`

**4-6 Author Users:**
- Realistic names and usernames
- Full profiles with bio
- Social links (Twitter, GitHub, Website)
- Role: `AUTHOR`

**8-10 Reader Users:**
- Realistic names and usernames
- Some with profiles, some without
- Role: `READER`

**All users share the same password:** `password123`

### Articles (20-30)

**Published Articles (70%):**
- Realistic titles and Markdown content
- Random tags (1-4 per article)
- Cover images from picsum.photos
- View counts (0-5000)
- Published dates within the past year

**Draft Articles (20%):**
- Same structure as published
- No view counts
- No published date

**Archived Articles (10%):**
- Older articles marked as archived

### Comments (50+)

**Top-Level Comments:**
- 0-8 comments per published article
- Realistic content (1-3 sentences)

**Replies (Nested Threading):**
- 0-3 replies per comment
- 30% chance of nested replies (depth 3)
- Tests the closure table pattern

### Claps

- Each published article gets claps from 0-10 users
- Each user claps 1-50 times per article
- Denormalized `likeCount` updated on articles

### Bookmarks

- Each user bookmarks 0-5 articles
- Only published articles can be bookmarked

### Follow Relationships

- Readers and authors follow 2-5 random authors
- Realistic social graph for testing personalized feeds

---

## Idempotency

The seed script is **idempotent** — it can be run multiple times safely.

**What happens on each run:**

1. ✅ Clears all existing data (in correct order to avoid FK constraints)
2. ✅ Truncates comment tables (including closure table)
3. ✅ Removes all follow relationships
4. ✅ Creates fresh data

**Safe to run as many times as needed for testing!**

---

## Testing the Data

### Login

Use any of these credentials:

```bash
# Admin account
Email: admin@example.com
Password: password123

# Any other user
Check the seed output for created usernames
Password: password123 (same for all)
```

### API Testing

```bash
# Login to get JWT token
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@example.com","password":"password123"}'

# Get explore feed
curl http://localhost:3001/api/v1/feed/explore

# Get user profile
curl http://localhost:3001/api/v1/users/profile/admin
```

### Verify Data

```bash
# Count users
psql -U postgres -d blog_platform -c "SELECT COUNT(*) FROM users;"

# Count articles by status
psql -U postgres -d blog_platform -c "SELECT status, COUNT(*) FROM posts GROUP BY status;"

# Count comments
psql -U postgres -d blog_platform -c "SELECT COUNT(*) FROM comments;"

# Check follow relationships
psql -U postgres -d blog_platform -c "SELECT COUNT(*) FROM users_following_users;"
```

---

## Customization

### Modify Data Amounts

Edit `src/database/seeds/seed.ts`:

```typescript
// Line 166: Number of authors
const numAuthors = faker.number.int({ min: 4, max: 6 });

// Line 193: Number of readers
const numReaders = faker.number.int({ min: 8, max: 10 });

// Line 241: Number of articles
const numArticles = faker.number.int({ min: 20, max: 30 });

// Line 278: Comments per article
const numComments = faker.number.int({ min: 0, max: 8 });
```

### Add More Tags

Edit the `TAGS` array (line 13):

```typescript
const TAGS = [
  'JavaScript',
  'TypeScript',
  // Add your tags here
  'New Tag',
];
```

### Customize Content

Edit `ARTICLE_TEMPLATES` (line 22) to add more Markdown templates.

---

## Troubleshooting

### Error: "Database connection failed"

**Fix:** Ensure PostgreSQL is running and `.env` is configured correctly.

```bash
# Check database connection
psql -U postgres -d blog_platform -c "SELECT 1;"
```

### Error: "Foreign key constraint violation"

**Fix:** The script clears data in the correct order. If this happens:

```bash
# Manually truncate all tables
psql -U postgres -d blog_platform -c "TRUNCATE users, posts, comments, claps, bookmarks, comments_closure CASCADE;"

# Then run seed again
npm run seed
```

### Error: "Module not found: @faker-js/faker"

**Fix:** Install dependencies:

```bash
npm install
```

### Slow Performance

**Expected:** The seed script creates 50+ comments with nested relationships using TypeORM's closure table.

**Typical runtime:** 5-15 seconds

To speed up:
- Reduce number of articles
- Reduce comments per article
- Remove nested replies

---

## Production Warning

⚠️ **NEVER run the seed script in production!**

The script:
- Deletes all existing data
- Creates test users with weak passwords
- Generates fake content

**For development and testing only.**

---

## Sample Output

```
🌱 Starting database seeding...
✅ Database connection established
🗑️  Clearing existing data...
✅ Existing data cleared
👥 Creating users...
  ✅ Created admin: admin
  ✅ Created author: john_doe
  ✅ Created author: jane_smith
  ✅ Created author: bob_johnson
  ✅ Created author: alice_williams
  ✅ Created reader: charlie_brown
  ✅ Created reader: david_miller
  ...
✅ Created 14 users total
🤝 Creating follow relationships...
✅ Created 42 follow relationships
📝 Creating articles...
✅ Created 25 articles
💬 Creating comments...
✅ Created 87 comments (including nested)
👏 Creating claps...
✅ Created 156 clap records
🔖 Creating bookmarks...
✅ Created 38 bookmarks

========================================
✨ Database seeding completed!
========================================
👥 Users: 14
   - Admins: 1
   - Authors: 5
   - Readers: 8
📝 Articles: 25
   - Published: 18
   - Drafts: 5
   - Archived: 2
💬 Comments: 87 (including nested)
👏 Claps: 156 users clapped
🔖 Bookmarks: 38
🤝 Follows: 42

🔑 Test credentials:
   Email: admin@example.com
   Password: password123
   (All users have the same password)
========================================
```

---

## Next Steps

After seeding:

1. **Start the backend:** `npm run dev`
2. **Login:** Use `admin@example.com` / `password123`
3. **Explore the API:** Visit http://localhost:3001/api/docs (Swagger)
4. **Test the frontend:** Start the Next.js app and browse articles

---

## See Also

- [API Documentation](./API_SPECIFICATION.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Deployment Guide](./DEPLOYMENT.md)
