import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Brackets } from 'typeorm';
import { Post, PostStatus } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryArticlesDto, ArticleSortBy } from './dto/query-articles.dto';
import { SearchArticlesDto } from './dto/search-articles.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .substring(0, 100); // Limit length
  }

  /**
   * Ensure slug is unique by appending number if needed
   */
  private async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const query = this.postsRepository.createQueryBuilder('post').where('post.slug = :slug', { slug });

      if (excludeId) {
        query.andWhere('post.id != :excludeId', { excludeId });
      }

      const existing = await query.getOne();

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * Calculate reading time based on word count
   * Average reading speed: 200 words per minute
   */
  private calculateReadingTime(content: string): number {
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return Math.max(1, minutes); // Minimum 1 minute
  }

  /**
   * Generate excerpt from content if not provided
   */
  private generateExcerpt(content: string, maxLength: number = 200): string {
    // Remove Markdown syntax for cleaner excerpt
    const plainText = content
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.+?)\*/g, '$1') // Remove italic
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links
      .replace(/`(.+?)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .trim();

    if (plainText.length <= maxLength) {
      return plainText;
    }

    return plainText.substring(0, maxLength).trim() + '...';
  }

  /**
   * Create a new article
   */
  async create(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    // Generate slug from title
    const baseSlug = this.generateSlug(createPostDto.title);
    const slug = await this.ensureUniqueSlug(baseSlug);

    // Calculate reading time
    const readingTimeMinutes = this.calculateReadingTime(createPostDto.content);

    // Generate excerpt if not provided
    const excerpt = createPostDto.excerpt || this.generateExcerpt(createPostDto.content);

    // Set publishedAt if status is published
    const publishedAt = createPostDto.status === PostStatus.PUBLISHED ? new Date() : null;

    const post = this.postsRepository.create({
      ...createPostDto,
      slug,
      excerpt,
      readingTimeMinutes,
      publishedAt,
      authorId: userId,
    });

    return await this.postsRepository.save(post);
  }

  /**
   * Get paginated list of articles with filters and sorting
   */
  async findAll(queryDto: QueryArticlesDto) {
    const { page = 1, limit = 20, status, tag, authorId, sortBy = ArticleSortBy.RECENT } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .select([
        'post.id',
        'post.title',
        'post.subtitle',
        'post.excerpt',
        'post.coverImageUrl',
        'post.slug',
        'post.status',
        'post.publishedAt',
        'post.viewCount',
        'post.likeCount',
        'post.commentCount',
        'post.readingTimeMinutes',
        'post.tags',
        'post.createdAt',
        'post.updatedAt',
        'author.id',
        'author.username',
        'author.fullName',
        'author.bio',
        'author.avatarUrl',
      ]);

    // Apply filters
    if (status) {
      queryBuilder.andWhere('post.status = :status', { status });
    }

    if (tag) {
      queryBuilder.andWhere(':tag = ANY(post.tags)', { tag });
    }

    if (authorId) {
      queryBuilder.andWhere('post.authorId = :authorId', { authorId });
    }

    // Apply sorting
    switch (sortBy) {
      case ArticleSortBy.POPULAR:
        // Sort by all-time engagement (likes + views)
        queryBuilder
          .addSelect('(post.likeCount + post.viewCount)', 'popularity')
          .orderBy('popularity', 'DESC')
          .addOrderBy('post.publishedAt', 'DESC');
        break;

      case ArticleSortBy.TRENDING:
        // Sort by recent engagement (last 7 days, time-decay algorithm)
        queryBuilder
          .andWhere('post.publishedAt >= :weekAgo', {
            weekAgo: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          })
          .addSelect(
            '(post.likeCount + post.viewCount) / GREATEST(1, EXTRACT(DAY FROM (NOW() - post.publishedAt)))',
            'trending_score',
          )
          .orderBy('trending_score', 'DESC')
          .addOrderBy('post.publishedAt', 'DESC');
        break;

      case ArticleSortBy.RECENT:
      default:
        // Sort by most recent
        queryBuilder.orderBy('post.publishedAt', 'DESC').addOrderBy('post.createdAt', 'DESC');
        break;
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const data = await queryBuilder.skip(skip).take(limit).getMany();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get single article by slug
   */
  async findBySlug(slug: string): Promise<Post> {
    const post = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .select([
        'post',
        'author.id',
        'author.username',
        'author.fullName',
        'author.bio',
        'author.avatarUrl',
        'author.socialLinks',
      ])
      .where('post.slug = :slug', { slug })
      .getOne();

    if (!post) {
      throw new NotFoundException(`Article with slug "${slug}" not found`);
    }

    // Increment view count
    await this.postsRepository.increment({ id: post.id }, 'viewCount', 1);
    post.viewCount += 1;

    return post;
  }

  /**
   * Update article (owner or admin only)
   */
  async update(
    slug: string,
    userId: string,
    userRole: UserRole,
    updatePostDto: UpdatePostDto,
  ): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { slug },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException(`Article with slug "${slug}" not found`);
    }

    // Check authorization (owner or admin)
    if (post.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only edit your own articles');
    }

    // If title changed, regenerate slug
    if (updatePostDto.title && updatePostDto.title !== post.title) {
      const baseSlug = this.generateSlug(updatePostDto.title);
      post.slug = await this.ensureUniqueSlug(baseSlug, post.id);
    }

    // If content changed, recalculate reading time
    if (updatePostDto.content) {
      post.readingTimeMinutes = this.calculateReadingTime(updatePostDto.content);
      // Regenerate excerpt if not provided
      if (!updatePostDto.excerpt) {
        post.excerpt = this.generateExcerpt(updatePostDto.content);
      }
    }

    // If status changed to published and not yet published, set publishedAt
    if (updatePostDto.status === PostStatus.PUBLISHED && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    // Update fields
    Object.assign(post, updatePostDto);

    return await this.postsRepository.save(post);
  }

  /**
   * Soft delete article (owner or admin only)
   */
  async remove(slug: string, userId: string, userRole: UserRole): Promise<{ message: string }> {
    const post = await this.postsRepository.findOne({
      where: { slug },
    });

    if (!post) {
      throw new NotFoundException(`Article with slug "${slug}" not found`);
    }

    // Check authorization (owner or admin)
    if (post.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own articles');
    }

    // Soft delete by setting status to archived
    post.status = PostStatus.ARCHIVED;
    await this.postsRepository.save(post);

    return { message: 'Article archived successfully' };
  }

  /**
   * Search articles by title and content
   */
  async search(searchDto: SearchArticlesDto) {
    const { query, page = 1, limit = 20 } = searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .select([
        'post.id',
        'post.title',
        'post.subtitle',
        'post.excerpt',
        'post.coverImageUrl',
        'post.slug',
        'post.status',
        'post.publishedAt',
        'post.viewCount',
        'post.likeCount',
        'post.commentCount',
        'post.readingTimeMinutes',
        'post.tags',
        'post.createdAt',
        'post.updatedAt',
        'author.id',
        'author.username',
        'author.fullName',
        'author.bio',
        'author.avatarUrl',
      ])
      .where(
        new Brackets((qb) => {
          qb.where('post.title ILIKE :query', { query: `%${query}%` }).orWhere('post.content ILIKE :query', {
            query: `%${query}%`,
          });
        }),
      )
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
      .orderBy('post.publishedAt', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const data = await queryBuilder.skip(skip).take(limit).getMany();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }
}
