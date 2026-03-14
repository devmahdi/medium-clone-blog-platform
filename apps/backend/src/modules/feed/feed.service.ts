import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Post, PostStatus } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { FeedQueryDto, ExploreFeedQueryDto, SortBy } from './dto/feed-query.dto';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Get personalized feed for authenticated user
   * Returns articles from authors the user follows
   */
  async getPersonalizedFeed(userId: string, query: FeedQueryDto) {
    const { page = 1, limit = 20, tag, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    // Get user's following list
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    if (!user || !user.following || user.following.length === 0) {
      // User not following anyone, return empty result
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    const followingIds = user.following.map((u) => u.id);

    // Build query for posts from followed authors
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.authorId IN (:...authorIds)', { authorIds: followingIds })
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED });

    // Apply filters
    this.applyFilters(queryBuilder, tag, dateFrom, dateTo);

    // Sort by recency (newest first)
    queryBuilder.orderBy('post.publishedAt', 'DESC').addOrderBy('post.createdAt', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const posts = await queryBuilder.skip(skip).take(limit).getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data: posts.map((post) => this.formatPostResponse(post)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get explore feed (global feed)
   * Returns all published articles with configurable sorting
   */
  async getExploreFeed(query: ExploreFeedQueryDto, userId?: string) {
    const { page = 1, limit = 20, sortBy = SortBy.RECENT, tag, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    // Build query for all published posts
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.status = :status', { status: PostStatus.PUBLISHED });

    // Apply filters
    this.applyFilters(queryBuilder, tag, dateFrom, dateTo);

    // Apply sorting
    this.applySorting(queryBuilder, sortBy);

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const posts = await queryBuilder.skip(skip).take(limit).getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data: posts.map((post) => this.formatPostResponse(post)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Apply common filters to query builder
   */
  private applyFilters(
    queryBuilder: SelectQueryBuilder<Post>,
    tag?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    // Filter by tag
    if (tag) {
      queryBuilder.andWhere(':tag = ANY(post.tags)', { tag });
    }

    // Filter by date range
    if (dateFrom) {
      queryBuilder.andWhere('post.publishedAt >= :dateFrom', {
        dateFrom: new Date(dateFrom),
      });
    }

    if (dateTo) {
      queryBuilder.andWhere('post.publishedAt <= :dateTo', {
        dateTo: new Date(dateTo),
      });
    }
  }

  /**
   * Apply sorting to query builder
   */
  private applySorting(queryBuilder: SelectQueryBuilder<Post>, sortBy: SortBy) {
    switch (sortBy) {
      case SortBy.RECENT:
        // Sort by published date, newest first
        queryBuilder.orderBy('post.publishedAt', 'DESC').addOrderBy('post.createdAt', 'DESC');
        break;

      case SortBy.POPULAR:
        // Sort by engagement (likes + views), highest first
        queryBuilder
          .addSelect('(post.likeCount + post.viewCount)', 'popularity')
          .orderBy('popularity', 'DESC')
          .addOrderBy('post.publishedAt', 'DESC');
        break;

      case SortBy.TRENDING:
        // Trending: recent posts with high engagement
        // Formula: (likes + views) / days_since_published
        // Recent posts get higher weight
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        queryBuilder
          .andWhere('post.publishedAt >= :sevenDaysAgo', { sevenDaysAgo })
          .addSelect(
            '(post.likeCount + post.viewCount) / GREATEST(1, EXTRACT(DAY FROM (NOW() - post.publishedAt)))',
            'trendingScore',
          )
          .orderBy('trendingScore', 'DESC')
          .addOrderBy('post.publishedAt', 'DESC');
        break;

      default:
        queryBuilder.orderBy('post.publishedAt', 'DESC');
    }
  }

  /**
   * Format post response with author details
   */
  private formatPostResponse(post: Post) {
    return {
      id: post.id,
      title: post.title,
      subtitle: post.subtitle,
      excerpt: post.excerpt,
      coverImageUrl: post.coverImageUrl,
      slug: post.slug,
      status: post.status,
      publishedAt: post.publishedAt,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      readingTimeMinutes: post.readingTimeMinutes,
      tags: post.tags || [],
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author
        ? {
            id: post.author.id,
            username: post.author.username,
            fullName: post.author.fullName,
            bio: post.author.bio,
            avatarUrl: post.author.avatarUrl,
          }
        : null,
    };
  }
}
