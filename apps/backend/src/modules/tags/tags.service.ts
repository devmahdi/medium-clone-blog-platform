import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { Post, PostStatus } from '../posts/entities/post.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { MergeTagsDto } from './dto/merge-tags.dto';
import { QueryTagArticlesDto } from './dto/query-tag-articles.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  /**
   * Generate URL-friendly slug from tag name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /**
   * Recalculate article count for a tag
   */
  private async recalculateArticleCount(tagId: string): Promise<void> {
    const tag = await this.tagsRepository.findOne({ where: { id: tagId } });
    if (!tag) return;

    const count = await this.postsRepository
      .createQueryBuilder('post')
      .where(':tagName = ANY(post.tags)', { tagName: tag.name })
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
      .getCount();

    tag.articleCount = count;
    await this.tagsRepository.save(tag);
  }

  /**
   * Get all tags with article counts
   */
  async findAll(): Promise<Tag[]> {
    return await this.tagsRepository.find({
      order: {
        articleCount: 'DESC',
        name: 'ASC',
      },
    });
  }

  /**
   * Get trending tags from last 7 days
   */
  async getTrending(limit: number = 10): Promise<Tag[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get tags used in articles published in last 7 days
    const recentArticles = await this.postsRepository
      .createQueryBuilder('post')
      .select('post.tags')
      .where('post.publishedAt >= :sevenDaysAgo', { sevenDaysAgo })
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
      .getMany();

    // Count tag occurrences
    const tagCounts = new Map<string, number>();
    recentArticles.forEach((article) => {
      if (article.tags) {
        article.tags.forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });

    // Get tag names sorted by count
    const trendingTagNames = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name]) => name);

    if (trendingTagNames.length === 0) {
      return [];
    }

    // Fetch full tag details
    return await this.tagsRepository
      .createQueryBuilder('tag')
      .where('tag.name IN (:...names)', { names: trendingTagNames })
      .orderBy(
        `CASE ${trendingTagNames.map((name, i) => `WHEN tag.name = '${name}' THEN ${i}`).join(' ')} END`,
      )
      .getMany();
  }

  /**
   * Get articles by tag with pagination
   */
  async getArticlesByTag(tagSlug: string, queryDto: QueryTagArticlesDto) {
    const { page = 1, limit = 20 } = queryDto;
    const skip = (page - 1) * limit;

    // Find tag by slug
    const tag = await this.tagsRepository.findOne({
      where: { slug: tagSlug },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with slug "${tagSlug}" not found`);
    }

    // Get articles with this tag
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
      .where(':tagName = ANY(post.tags)', { tagName: tag.name })
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
      .orderBy('post.publishedAt', 'DESC');

    const total = await queryBuilder.getCount();
    const data = await queryBuilder.skip(skip).take(limit).getMany();

    return {
      tag,
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
   * Create a new tag (admin only)
   */
  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const slug = this.generateSlug(createTagDto.name);

    // Check if tag already exists
    const existing = await this.tagsRepository.findOne({
      where: [{ name: createTagDto.name }, { slug }],
    });

    if (existing) {
      throw new ConflictException(`Tag "${createTagDto.name}" already exists`);
    }

    const tag = this.tagsRepository.create({
      name: createTagDto.name,
      slug,
      articleCount: 0,
    });

    const saved = await this.tagsRepository.save(tag);

    // Recalculate article count in case articles already use this tag
    await this.recalculateArticleCount(saved.id);

    return await this.tagsRepository.findOne({ where: { id: saved.id } });
  }

  /**
   * Update a tag (admin only)
   */
  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    const tag = await this.tagsRepository.findOne({ where: { id } });

    if (!tag) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }

    if (updateTagDto.name) {
      const newSlug = this.generateSlug(updateTagDto.name);

      // Check if new name conflicts with existing tag
      const existing = await this.tagsRepository.findOne({
        where: [{ name: updateTagDto.name }, { slug: newSlug }],
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`Tag "${updateTagDto.name}" already exists`);
      }

      tag.name = updateTagDto.name;
      tag.slug = newSlug;
    }

    await this.tagsRepository.save(tag);
    await this.recalculateArticleCount(id);

    return await this.tagsRepository.findOne({ where: { id } });
  }

  /**
   * Delete a tag (admin only)
   */
  async remove(id: string): Promise<{ message: string }> {
    const tag = await this.tagsRepository.findOne({ where: { id } });

    if (!tag) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }

    await this.tagsRepository.remove(tag);

    return { message: 'Tag deleted successfully' };
  }

  /**
   * Merge two tags (admin only)
   * Replaces all occurrences of source tag with target tag in articles
   */
  async merge(sourceId: string, mergeDto: MergeTagsDto): Promise<Tag> {
    const sourceTag = await this.tagsRepository.findOne({
      where: { id: sourceId },
    });

    if (!sourceTag) {
      throw new NotFoundException(`Source tag with ID "${sourceId}" not found`);
    }

    const targetTag = await this.tagsRepository.findOne({
      where: { id: mergeDto.targetTagId },
    });

    if (!targetTag) {
      throw new NotFoundException(`Target tag with ID "${mergeDto.targetTagId}" not found`);
    }

    if (sourceId === mergeDto.targetTagId) {
      throw new BadRequestException('Cannot merge a tag into itself');
    }

    // Find all articles with source tag
    const articlesWithSourceTag = await this.postsRepository
      .createQueryBuilder('post')
      .where(':tagName = ANY(post.tags)', { tagName: sourceTag.name })
      .getMany();

    // Replace source tag with target tag in all articles
    for (const article of articlesWithSourceTag) {
      if (article.tags) {
        // Remove source tag and add target tag (if not already present)
        const newTags = article.tags
          .filter((tag) => tag !== sourceTag.name)
          .concat(article.tags.includes(targetTag.name) ? [] : [targetTag.name]);

        article.tags = newTags;
        await this.postsRepository.save(article);
      }
    }

    // Delete source tag
    await this.tagsRepository.remove(sourceTag);

    // Recalculate article count for target tag
    await this.recalculateArticleCount(targetTag.id);

    return await this.tagsRepository.findOne({
      where: { id: mergeDto.targetTagId },
    });
  }
}
