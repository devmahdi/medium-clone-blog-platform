import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';
import { Comment, CommentStatus } from './entities/comment.entity';
import { Post } from '../posts/entities/post.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: TreeRepository<Comment>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  /**
   * Create a comment on an article
   */
  async createComment(
    articleId: string,
    userId: string,
    createCommentDto: CreateCommentDto,
  ) {
    // Verify article exists
    const post = await this.postsRepository.findOne({ where: { id: articleId } });
    if (!post) {
      throw new NotFoundException('Article not found');
    }

    // Create comment
    const comment = this.commentsRepository.create({
      content: createCommentDto.content,
      postId: articleId,
      userId,
      status: CommentStatus.APPROVED, // Auto-approve for now
    });

    const savedComment = await this.commentsRepository.save(comment);

    // Increment comment count on post
    await this.postsRepository.increment({ id: articleId }, 'commentCount', 1);

    // Load user details
    const commentWithUser = await this.commentsRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });

    return this.formatComment(commentWithUser, userId);
  }

  /**
   * Create a reply to an existing comment
   */
  async createReply(
    commentId: string,
    userId: string,
    createCommentDto: CreateCommentDto,
  ) {
    // Verify parent comment exists
    const parentComment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: ['post'],
    });

    if (!parentComment) {
      throw new NotFoundException('Parent comment not found');
    }

    if (parentComment.status === CommentStatus.DELETED) {
      throw new BadRequestException('Cannot reply to a deleted comment');
    }

    // Create reply
    const reply = this.commentsRepository.create({
      content: createCommentDto.content,
      postId: parentComment.postId,
      userId,
      parentId: commentId,
      status: CommentStatus.APPROVED,
    });

    // Save with parent relationship
    const savedReply = await this.commentsRepository.save(reply);

    // Increment comment count on post
    await this.postsRepository.increment({ id: parentComment.postId }, 'commentCount', 1);

    // Load user details
    const replyWithUser = await this.commentsRepository.findOne({
      where: { id: savedReply.id },
      relations: ['user'],
    });

    return this.formatComment(replyWithUser, userId);
  }

  /**
   * Get all comments for an article in tree structure
   */
  async getArticleComments(articleId: string, userId?: string) {
    // Verify article exists
    const post = await this.postsRepository.findOne({ where: { id: articleId } });
    if (!post) {
      throw new NotFoundException('Article not found');
    }

    // Get all root comments (no parent) for this article
    const rootComments = await this.commentsRepository.find({
      where: {
        postId: articleId,
        parentId: null,
        status: CommentStatus.APPROVED, // Only show approved comments
      },
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
    });

    // Build tree for each root comment
    const commentsTree = await Promise.all(
      rootComments.map(async (comment) => {
        return this.buildCommentTree(comment, userId);
      }),
    );

    return {
      comments: commentsTree,
      total: commentsTree.length,
    };
  }

  /**
   * Update a comment (owner or admin only)
   */
  async updateComment(
    commentId: string,
    userId: string,
    updateCommentDto: UpdateCommentDto,
    isAdmin: boolean = false,
  ) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.status === CommentStatus.DELETED) {
      throw new BadRequestException('Cannot edit a deleted comment');
    }

    // Check authorization
    if (comment.userId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    // Update comment
    comment.content = updateCommentDto.content;
    comment.isEdited = true;

    const updatedComment = await this.commentsRepository.save(comment);

    return this.formatComment(updatedComment, userId);
  }

  /**
   * Delete a comment (soft delete to preserve context)
   */
  async deleteComment(commentId: string, userId: string, isAdmin: boolean = false) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.status === CommentStatus.DELETED) {
      throw new BadRequestException('Comment already deleted');
    }

    // Check authorization
    if (comment.userId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Soft delete: mark as deleted and clear content
    comment.status = CommentStatus.DELETED;
    comment.content = '[deleted]';

    await this.commentsRepository.save(comment);

    // Decrement comment count on post (only for root comments)
    if (!comment.parentId) {
      await this.postsRepository.decrement({ id: comment.postId }, 'commentCount', 1);
    }

    return {
      message: 'Comment deleted successfully',
      id: commentId,
    };
  }

  /**
   * Build comment tree recursively using TypeORM's closure table
   */
  private async buildCommentTree(comment: Comment, userId?: string): Promise<any> {
    // Get all descendants using closure table
    const descendants = await this.commentsRepository.findDescendantsTree(comment, {
      relations: ['user'],
    });

    return this.formatCommentTree(descendants, userId);
  }

  /**
   * Format comment tree recursively
   */
  private formatCommentTree(comment: Comment, userId?: string): any {
    const formatted = this.formatComment(comment, userId);

    if (comment.replies && comment.replies.length > 0) {
      formatted.replies = comment.replies
        .filter((reply) => reply.status !== CommentStatus.DELETED || reply.replies?.length > 0)
        .map((reply) => this.formatCommentTree(reply, userId));
    } else {
      formatted.replies = [];
    }

    return formatted;
  }

  /**
   * Format a single comment
   */
  private formatComment(comment: Comment, userId?: string) {
    return {
      id: comment.id,
      content: comment.content,
      status: comment.status,
      likeCount: comment.likeCount,
      isEdited: comment.isEdited,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: comment.user
        ? {
            id: comment.user.id,
            username: comment.user.username,
            fullName: comment.user.fullName,
            avatarUrl: comment.user.avatarUrl,
          }
        : null,
      canEdit: userId ? comment.userId === userId : false,
      canDelete: userId ? comment.userId === userId : false,
    };
  }

  /**
   * Get comment by ID (for internal use)
   */
  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }
}
