import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark } from './entities/bookmark.entity';
import { Post, PostStatus } from '../posts/entities/post.entity';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private readonly bookmarksRepository: Repository<Bookmark>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  /**
   * Save an article to bookmarks
   */
  async createBookmark(userId: string, createBookmarkDto: CreateBookmarkDto) {
    const { postId } = createBookmarkDto;

    // Verify article exists and is published
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Article not found');
    }

    if (post.status !== PostStatus.PUBLISHED) {
      throw new NotFoundException('Article not available');
    }

    // Check if already bookmarked
    const existing = await this.bookmarksRepository.findOne({
      where: { postId, userId },
    });

    if (existing) {
      throw new ConflictException('Article already bookmarked');
    }

    // Create bookmark
    const bookmark = this.bookmarksRepository.create({
      postId,
      userId,
    });

    await this.bookmarksRepository.save(bookmark);

    return {
      message: 'Article bookmarked successfully',
      bookmarkId: bookmark.id,
      postId,
    };
  }

  /**
   * Remove an article from bookmarks
   */
  async removeBookmark(userId: string, articleId: string) {
    const bookmark = await this.bookmarksRepository.findOne({
      where: { postId: articleId, userId },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.bookmarksRepository.remove(bookmark);

    return {
      message: 'Bookmark removed successfully',
      postId: articleId,
    };
  }

  /**
   * Get user's bookmarked articles
   */
  async getUserBookmarks(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Get bookmarks with article details
    const [bookmarks, total] = await this.bookmarksRepository.findAndCount({
      where: { userId },
      relations: ['post', 'post.author'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    // Filter out articles that are no longer published
    const validBookmarks = bookmarks.filter(
      (b) => b.post && b.post.status === PostStatus.PUBLISHED,
    );

    const articles = validBookmarks.map((bookmark) => ({
      id: bookmark.post.id,
      title: bookmark.post.title,
      subtitle: bookmark.post.subtitle,
      excerpt: bookmark.post.excerpt,
      coverImageUrl: bookmark.post.coverImageUrl,
      slug: bookmark.post.slug,
      publishedAt: bookmark.post.publishedAt,
      viewCount: bookmark.post.viewCount,
      likeCount: bookmark.post.likeCount,
      commentCount: bookmark.post.commentCount,
      readingTimeMinutes: bookmark.post.readingTimeMinutes,
      tags: bookmark.post.tags || [],
      bookmarkedAt: bookmark.createdAt,
      author: bookmark.post.author
        ? {
            id: bookmark.post.author.id,
            username: bookmark.post.author.username,
            fullName: bookmark.post.author.fullName,
            avatarUrl: bookmark.post.author.avatarUrl,
          }
        : null,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data: articles,
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
   * Check if user has bookmarked an article
   */
  async isBookmarked(userId: string, articleId: string): Promise<boolean> {
    const bookmark = await this.bookmarksRepository.findOne({
      where: { postId: articleId, userId },
    });
    return !!bookmark;
  }
}
