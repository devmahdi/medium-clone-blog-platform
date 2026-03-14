import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import { Post, PostStatus } from '../../modules/posts/entities/post.entity';
import { Comment, CommentStatus } from '../../modules/comments/entities/comment.entity';
import { Clap } from '../../modules/claps/entities/clap.entity';
import { Bookmark } from '../../modules/bookmarks/entities/bookmark.entity';

// Load environment variables
config();

// Sample tags for articles
const TAGS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'Web Development',
  'AI & Machine Learning',
  'DevOps',
  'Cloud Computing',
  'Database',
];

// Sample Markdown content templates
const ARTICLE_TEMPLATES = [
  (title: string) => `# ${title}

## Introduction

${faker.lorem.paragraphs(2)}

## Main Content

${faker.lorem.paragraphs(3)}

### Key Points

- ${faker.lorem.sentence()}
- ${faker.lorem.sentence()}
- ${faker.lorem.sentence()}

## Conclusion

${faker.lorem.paragraphs(2)}
`,
  (title: string) => `# ${title}

${faker.lorem.paragraphs(1)}

## What is ${title.split(' ')[0]}?

${faker.lorem.paragraphs(2)}

## Benefits

1. ${faker.lorem.sentence()}
2. ${faker.lorem.sentence()}
3. ${faker.lorem.sentence()}

## Implementation

\`\`\`typescript
const example = () => {
  console.log('${faker.lorem.sentence()}');
};
\`\`\`

${faker.lorem.paragraphs(2)}

## Conclusion

${faker.lorem.paragraph()}
`,
];

async function seed() {
  console.log('🌱 Starting database seeding...');

  // Create database connection
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'blog_platform',
    entities: [User, Post, Comment, Clap, Bookmark],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Get repositories
    const userRepository = dataSource.getRepository(User);
    const postRepository = dataSource.getRepository(Post);
    const commentRepository = dataSource.getRepository(Comment);
    const clapRepository = dataSource.getRepository(Clap);
    const bookmarkRepository = dataSource.getRepository(Bookmark);

    // Clear existing data (in correct order to avoid foreign key constraints)
    console.log('🗑️  Clearing existing data...');
    await clapRepository.delete({});
    await bookmarkRepository.delete({});
    await commentRepository.query('TRUNCATE TABLE comments CASCADE');
    await commentRepository.query('TRUNCATE TABLE comments_closure CASCADE');
    await postRepository.delete({});
    // Clear follow relationships
    await userRepository
      .createQueryBuilder()
      .relation(User, 'following')
      .of({})
      .remove({});
    await userRepository.delete({});
    console.log('✅ Existing data cleared');

    // Create users
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const users: User[] = [];

    // Create 1 admin user
    const admin = userRepository.create({
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      fullName: 'Admin User',
      bio: 'Platform administrator',
      role: UserRole.ADMIN,
      avatarUrl: faker.image.avatar(),
      isActive: true,
      emailVerified: true,
    });
    await userRepository.save(admin);
    users.push(admin);
    console.log(`  ✅ Created admin: ${admin.username}`);

    // Create 4-6 author users
    const numAuthors = faker.number.int({ min: 4, max: 6 });
    for (let i = 0; i < numAuthors; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const username = faker.internet.userName({ firstName, lastName }).toLowerCase();

      const author = userRepository.create({
        email: faker.internet.email({ firstName, lastName }),
        username,
        password: hashedPassword,
        fullName: `${firstName} ${lastName}`,
        bio: faker.lorem.sentence(),
        role: UserRole.AUTHOR,
        avatarUrl: faker.image.avatar(),
        socialLinks: {
          twitter: faker.datatype.boolean()
            ? `https://twitter.com/${username}`
            : undefined,
          github: faker.datatype.boolean()
            ? `https://github.com/${username}`
            : undefined,
          website: faker.datatype.boolean() ? faker.internet.url() : undefined,
        },
        isActive: true,
        emailVerified: true,
      });
      await userRepository.save(author);
      users.push(author);
      console.log(`  ✅ Created author: ${author.username}`);
    }

    // Create 8-10 reader users
    const numReaders = faker.number.int({ min: 8, max: 10 });
    for (let i = 0; i < numReaders; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const username = faker.internet.userName({ firstName, lastName }).toLowerCase();

      const reader = userRepository.create({
        email: faker.internet.email({ firstName, lastName }),
        username,
        password: hashedPassword,
        fullName: `${firstName} ${lastName}`,
        bio: faker.datatype.boolean() ? faker.lorem.sentence() : null,
        role: UserRole.READER,
        avatarUrl: faker.datatype.boolean() ? faker.image.avatar() : null,
        isActive: true,
        emailVerified: faker.datatype.boolean(),
      });
      await userRepository.save(reader);
      users.push(reader);
      console.log(`  ✅ Created reader: ${reader.username}`);
    }

    console.log(`✅ Created ${users.length} users total`);

    // Create follow relationships
    console.log('🤝 Creating follow relationships...');
    let followCount = 0;
    for (const user of users) {
      if (user.role === UserRole.READER || user.role === UserRole.AUTHOR) {
        // Each user follows 2-5 random authors
        const numFollows = faker.number.int({ min: 2, max: 5 });
        const authors = users.filter((u) => u.role === UserRole.AUTHOR);
        const shuffled = faker.helpers.shuffle(authors);
        const toFollow = shuffled.slice(0, Math.min(numFollows, authors.length));

        for (const author of toFollow) {
          if (author.id !== user.id) {
            await userRepository
              .createQueryBuilder()
              .relation(User, 'following')
              .of(user)
              .add(author);
            followCount++;
          }
        }
      }
    }
    console.log(`✅ Created ${followCount} follow relationships`);

    // Create articles
    console.log('📝 Creating articles...');
    const posts: Post[] = [];
    const authors = users.filter((u) => u.role === UserRole.AUTHOR);
    const numArticles = faker.number.int({ min: 20, max: 30 });

    for (let i = 0; i < numArticles; i++) {
      const author = faker.helpers.arrayElement(authors);
      const title = faker.lorem.sentence({ min: 3, max: 8 });
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)
        + `-${faker.string.alphanumeric(6)}`;

      const template = faker.helpers.arrayElement(ARTICLE_TEMPLATES);
      const content = template(title);

      // Mix of statuses
      let status: PostStatus;
      const rand = Math.random();
      if (rand < 0.7) status = PostStatus.PUBLISHED;
      else if (rand < 0.9) status = PostStatus.DRAFT;
      else status = PostStatus.ARCHIVED;

      const post = postRepository.create({
        title,
        subtitle: faker.datatype.boolean() ? faker.lorem.sentence() : null,
        slug,
        body: content,
        excerpt: faker.lorem.sentences(2),
        coverImageUrl: faker.datatype.boolean()
          ? `https://picsum.photos/seed/${slug}/1200/630`
          : null,
        tags: faker.helpers.arrayElements(TAGS, { min: 1, max: 4 }),
        status,
        readingTimeMinutes: faker.number.int({ min: 2, max: 15 }),
        viewCount: status === PostStatus.PUBLISHED ? faker.number.int({ min: 0, max: 5000 }) : 0,
        likeCount: 0, // Will be updated when creating claps
        commentCount: 0, // Will be updated when creating comments
        authorId: author.id,
        publishedAt: status === PostStatus.PUBLISHED
          ? faker.date.past({ years: 1 })
          : null,
      });

      await postRepository.save(post);
      posts.push(post);
    }
    console.log(`✅ Created ${posts.length} articles`);

    // Create comments
    console.log('💬 Creating comments...');
    const publishedPosts = posts.filter((p) => p.status === PostStatus.PUBLISHED);
    const allComments: Comment[] = [];

    for (const post of publishedPosts) {
      // Each article gets 0-8 top-level comments
      const numComments = faker.number.int({ min: 0, max: 8 });

      for (let i = 0; i < numComments; i++) {
        const commenter = faker.helpers.arrayElement(users);
        const comment = commentRepository.create({
          content: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
          postId: post.id,
          userId: commenter.id,
          status: CommentStatus.APPROVED,
          likeCount: faker.number.int({ min: 0, max: 50 }),
          isEdited: faker.datatype.boolean({ probability: 0.2 }),
        });
        await commentRepository.save(comment);
        allComments.push(comment);

        // Add 0-3 replies to this comment
        const numReplies = faker.number.int({ min: 0, max: 3 });
        for (let j = 0; j < numReplies; j++) {
          const replier = faker.helpers.arrayElement(users);
          const reply = commentRepository.create({
            content: faker.lorem.sentences(faker.number.int({ min: 1, max: 2 })),
            postId: post.id,
            userId: replier.id,
            parent: comment,
            status: CommentStatus.APPROVED,
            likeCount: faker.number.int({ min: 0, max: 20 }),
            isEdited: false,
          });
          await commentRepository.save(reply);
          allComments.push(reply);

          // 30% chance of nested reply (depth 3)
          if (faker.datatype.boolean({ probability: 0.3 })) {
            const nestedReplier = faker.helpers.arrayElement(users);
            const nestedReply = commentRepository.create({
              content: faker.lorem.sentence(),
              postId: post.id,
              userId: nestedReplier.id,
              parent: reply,
              status: CommentStatus.APPROVED,
              likeCount: faker.number.int({ min: 0, max: 10 }),
              isEdited: false,
            });
            await commentRepository.save(nestedReply);
            allComments.push(nestedReply);
          }
        }
      }
    }

    // Update comment counts on posts
    for (const post of publishedPosts) {
      const count = await commentRepository.count({ where: { postId: post.id } });
      post.commentCount = count;
      await postRepository.save(post);
    }

    console.log(`✅ Created ${allComments.length} comments (including nested)`);

    // Create claps
    console.log('👏 Creating claps...');
    let clapCount = 0;
    for (const post of publishedPosts) {
      // Each published article gets claps from 0-10 users
      const numClappers = faker.number.int({ min: 0, max: 10 });
      const clappers = faker.helpers.arrayElements(users, numClappers);

      let totalClaps = 0;
      for (const clapper of clappers) {
        const clapAmount = faker.number.int({ min: 1, max: 50 });
        const clap = clapRepository.create({
          postId: post.id,
          userId: clapper.id,
          count: clapAmount,
        });
        await clapRepository.save(clap);
        clapCount++;
        totalClaps += clapAmount;
      }

      // Update denormalized like count on post
      post.likeCount = totalClaps;
      await postRepository.save(post);
    }
    console.log(`✅ Created ${clapCount} clap records`);

    // Create bookmarks
    console.log('🔖 Creating bookmarks...');
    let bookmarkCount = 0;
    for (const user of users) {
      // Each user bookmarks 0-5 articles
      const numBookmarks = faker.number.int({ min: 0, max: 5 });
      const bookmarkedPosts = faker.helpers.arrayElements(publishedPosts, numBookmarks);

      for (const post of bookmarkedPosts) {
        const bookmark = bookmarkRepository.create({
          postId: post.id,
          userId: user.id,
        });
        await bookmarkRepository.save(bookmark);
        bookmarkCount++;
      }
    }
    console.log(`✅ Created ${bookmarkCount} bookmarks`);

    // Print summary
    console.log('\n========================================');
    console.log('✨ Database seeding completed!');
    console.log('========================================');
    console.log(`👥 Users: ${users.length}`);
    console.log(`   - Admins: 1`);
    console.log(`   - Authors: ${authors.length}`);
    console.log(`   - Readers: ${users.length - authors.length - 1}`);
    console.log(`📝 Articles: ${posts.length}`);
    console.log(`   - Published: ${publishedPosts.length}`);
    console.log(`   - Drafts: ${posts.filter((p) => p.status === PostStatus.DRAFT).length}`);
    console.log(`   - Archived: ${posts.filter((p) => p.status === PostStatus.ARCHIVED).length}`);
    console.log(`💬 Comments: ${allComments.length} (including nested)`);
    console.log(`👏 Claps: ${clapCount} users clapped`);
    console.log(`🔖 Bookmarks: ${bookmarkCount}`);
    console.log(`🤝 Follows: ${followCount}`);
    console.log(`\n🔑 Test credentials:`);
    console.log(`   Email: admin@example.com`);
    console.log(`   Password: password123`);
    console.log(`   (All users have the same password)`);
    console.log('========================================\n');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run seed
seed();
