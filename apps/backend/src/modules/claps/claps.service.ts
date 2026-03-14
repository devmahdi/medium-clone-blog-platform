import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clap } from './entities/clap.entity';
import { Post } from '../posts/entities/post.entity';
import { ClapDto } from './dto/clap.dto';

const MAX_CLAPS_PER_USER = 50;

@Injectable()
export class ClapsService {
  constructor(
    @InjectRepository(Clap)
    private readonly clapsRepository: Repository<Clap>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  /**
   * Add claps to an article
   * Users can clap up to 50 times per article
   */
  async clapArticle(articleId: string, userId: string, clapDto: ClapDto) {
    const { count = 1 } = clapDto;

    // Verify article exists
    const post = await this.postsRepository.findOne({ where: { id: articleId } });
    if (!post) {
      throw new NotFoundException('Article not found');
    }

    // Find existing clap record
    let clap = await this.clapsRepository.findOne({
      where: { postId: articleId, userId },
    });

    if (clap) {
      // Update existing clap
      const newCount = clap.count + count;

      if (newCount > MAX_CLAPS_PER_USER) {
        throw new BadRequestException(
          `Maximum ${MAX_CLAPS_PER_USER} claps per article. You have already clapped ${clap.count} times.`,
        );
      }

      const previousCount = clap.count;
      clap.count = newCount;
      await this.clapsRepository.save(clap);

      // Update denormalized counter on post
      await this.postsRepository.increment(
        { id: articleId },
        'likeCount',
        count,
      );

      return {
        userClaps: newCount,
        totalClaps: post.likeCount + count,
        added: count,
        message: `Added ${count} clap(s). You have clapped ${newCount} times.`,
      };
    } else {
      // Create new clap record
      if (count > MAX_CLAPS_PER_USER) {
        throw new BadRequestException(
          `Maximum ${MAX_CLAPS_PER_USER} claps per article`,
        );
      }

      clap = this.clapsRepository.create({
        postId: articleId,
        userId,
        count,
      });

      await this.clapsRepository.save(clap);

      // Update denormalized counter on post
      await this.postsRepository.increment(
        { id: articleId },
        'likeCount',
        count,
      );

      return {
        userClaps: count,
        totalClaps: post.likeCount + count,
        added: count,
        message: `Added ${count} clap(s). You have clapped ${count} times.`,
      };
    }
  }

  /**
   * Get total claps for an article and user's clap count
   */
  async getArticleClaps(articleId: string, userId?: string) {
    // Verify article exists
    const post = await this.postsRepository.findOne({ where: { id: articleId } });
    if (!post) {
      throw new NotFoundException('Article not found');
    }

    let userClaps = 0;

    if (userId) {
      const clap = await this.clapsRepository.findOne({
        where: { postId: articleId, userId },
      });
      userClaps = clap ? clap.count : 0;
    }

    return {
      totalClaps: post.likeCount,
      userClaps,
      maxClaps: MAX_CLAPS_PER_USER,
      canClap: userClaps < MAX_CLAPS_PER_USER,
    };
  }

  /**
   * Get user's clap count for a specific article
   */
  async getUserClapCount(articleId: string, userId: string): Promise<number> {
    const clap = await this.clapsRepository.findOne({
      where: { postId: articleId, userId },
    });
    return clap ? clap.count : 0;
  }
}
