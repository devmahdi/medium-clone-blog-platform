import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Clap } from '../claps/entities/clap.entity';
import { GrowthQueryDto } from './dto/growth-query.dto';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(Clap)
    private readonly clapsRepository: Repository<Clap>,
  ) {}

  /**
   * Get platform overview statistics
   */
  async getOverview() {
    // Total counts
    const totalUsers = await this.usersRepository.count();
    const totalArticles = await this.postsRepository.count();
    const totalComments = await this.commentsRepository.count();
    
    // Total claps (sum of all clap counts)
    const clapsResult = await this.clapsRepository
      .createQueryBuilder('clap')
      .select('SUM(clap.count)', 'total')
      .getRawOne();
    const totalClaps = parseInt(clapsResult?.total || '0', 10);

    // Total views (sum of all article view counts)
    const viewsResult = await this.postsRepository
      .createQueryBuilder('post')
      .select('SUM(post.viewCount)', 'total')
      .getRawOne();
    const totalViews = parseInt(viewsResult?.total || '0', 10);

    // Users by role
    const usersByRole = await this.usersRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    // Articles by status
    const articlesByStatus = await this.postsRepository
      .createQueryBuilder('post')
      .select('post.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('post.status')
      .getRawMany();

    // Top articles (most viewed)
    const topViewedArticles = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .orderBy('post.viewCount', 'DESC')
      .take(10)
      .getMany();

    // Top articles (most clapped)
    const topClappedArticles = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .orderBy('post.likeCount', 'DESC')
      .take(10)
      .getMany();

    // Top articles (most commented)
    const topCommentedArticles = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .orderBy('post.commentCount', 'DESC')
      .take(10)
      .getMany();

    // Format article data
    const formatArticle = (post: Post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      publishedAt: post.publishedAt,
      author: post.author ? {
        id: post.author.id,
        username: post.author.username,
        fullName: post.author.fullName,
      } : null,
    });

    return {
      overview: {
        totalUsers,
        totalArticles,
        totalComments,
        totalClaps,
        totalViews,
      },
      usersByRole: usersByRole.map((item) => ({
        role: item.role,
        count: parseInt(item.count, 10),
      })),
      articlesByStatus: articlesByStatus.map((item) => ({
        status: item.status,
        count: parseInt(item.count, 10),
      })),
      topContent: {
        mostViewed: topViewedArticles.map(formatArticle),
        mostClapped: topClappedArticles.map(formatArticle),
        mostCommented: topCommentedArticles.map(formatArticle),
      },
    };
  }

  /**
   * Get growth statistics over time
   */
  async getGrowth(query: GrowthQueryDto) {
    const { period = 'day', startDate, endDate } = query;

    // Default date range: last 30 days
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() - 30);
    
    const start = startDate ? new Date(startDate) : defaultStart;
    const end = endDate ? new Date(endDate) : now;

    // PostgreSQL date_trunc format based on period
    const truncFormat = period === 'day' ? 'day' : period === 'week' ? 'week' : 'month';

    // User growth
    const userGrowth = await this.usersRepository
      .createQueryBuilder('user')
      .select(`DATE_TRUNC('${truncFormat}', user.createdAt)`, 'date')
      .addSelect('COUNT(*)', 'count')
      .where('user.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Article growth
    const articleGrowth = await this.postsRepository
      .createQueryBuilder('post')
      .select(`DATE_TRUNC('${truncFormat}', post.createdAt)`, 'date')
      .addSelect('COUNT(*)', 'count')
      .where('post.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Comment growth
    const commentGrowth = await this.commentsRepository
      .createQueryBuilder('comment')
      .select(`DATE_TRUNC('${truncFormat}', comment.createdAt)`, 'date')
      .addSelect('COUNT(*)', 'count')
      .where('comment.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Claps growth (sum of clap counts, not clap records)
    const clapsGrowth = await this.clapsRepository
      .createQueryBuilder('clap')
      .select(`DATE_TRUNC('${truncFormat}', clap.createdAt)`, 'date')
      .addSelect('SUM(clap.count)', 'count')
      .where('clap.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Format results for charts
    const formatGrowth = (data: any[]) =>
      data.map((item) => ({
        date: item.date,
        count: parseInt(item.count, 10),
      }));

    return {
      period,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      users: formatGrowth(userGrowth),
      articles: formatGrowth(articleGrowth),
      comments: formatGrowth(commentGrowth),
      claps: formatGrowth(clapsGrowth),
    };
  }

  /**
   * Get analytics for a specific article
   */
  async getArticleAnalytics(articleId: string) {
    // Find article
    const article = await this.postsRepository.findOne({
      where: { id: articleId },
      relations: ['author'],
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Get comments count by date
    const commentsByDate = await this.commentsRepository
      .createQueryBuilder('comment')
      .select(`DATE_TRUNC('day', comment.createdAt)`, 'date')
      .addSelect('COUNT(*)', 'count')
      .where('comment.postId = :articleId', { articleId })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Get claps count by date
    const clapsByDate = await this.clapsRepository
      .createQueryBuilder('clap')
      .select(`DATE_TRUNC('day', clap.createdAt)`, 'date')
      .addSelect('SUM(clap.count)', 'count')
      .where('clap.postId = :articleId', { articleId })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Get top clappers
    const topClappers = await this.clapsRepository
      .createQueryBuilder('clap')
      .leftJoinAndSelect('clap.user', 'user')
      .where('clap.postId = :articleId', { articleId })
      .orderBy('clap.count', 'DESC')
      .take(10)
      .getMany();

    // Get top commenters
    const topCommenters = await this.commentsRepository
      .createQueryBuilder('comment')
      .select('comment.userId', 'userId')
      .addSelect('user.username', 'username')
      .addSelect('user.fullName', 'fullName')
      .addSelect('user.avatarUrl', 'avatarUrl')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('comment.user', 'user')
      .where('comment.postId = :articleId', { articleId })
      .groupBy('comment.userId')
      .addGroupBy('user.username')
      .addGroupBy('user.fullName')
      .addGroupBy('user.avatarUrl')
      .orderBy('count', 'DESC')
      .take(10)
      .getRawMany();

    return {
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        status: article.status,
        publishedAt: article.publishedAt,
        viewCount: article.viewCount,
        likeCount: article.likeCount,
        commentCount: article.commentCount,
        readingTimeMinutes: article.readingTimeMinutes,
        author: article.author ? {
          id: article.author.id,
          username: article.author.username,
          fullName: article.author.fullName,
        } : null,
      },
      engagement: {
        totalViews: article.viewCount,
        totalClaps: article.likeCount,
        totalComments: article.commentCount,
        averageClapsPerUser: topClappers.length > 0
          ? Math.round(article.likeCount / topClappers.length)
          : 0,
      },
      timeline: {
        commentsByDate: commentsByDate.map((item) => ({
          date: item.date,
          count: parseInt(item.count, 10),
        })),
        clapsByDate: clapsByDate.map((item) => ({
          date: item.date,
          count: parseInt(item.count, 10),
        })),
      },
      topEngagers: {
        clappers: topClappers.map((clap) => ({
          userId: clap.userId,
          username: clap.user?.username,
          fullName: clap.user?.fullName,
          avatarUrl: clap.user?.avatarUrl,
          claps: clap.count,
        })),
        commenters: topCommenters.map((item) => ({
          userId: item.userId,
          username: item.username,
          fullName: item.fullName,
          avatarUrl: item.avatarUrl,
          comments: parseInt(item.count, 10),
        })),
      },
    };
  }
}
