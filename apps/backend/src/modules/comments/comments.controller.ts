import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('/articles/:articleId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a comment on an article',
    description: 'Add a new top-level comment to an article. Requires authentication.',
  })
  @ApiParam({
    name: 'articleId',
    description: 'Article UUID',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        content: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'approved', 'hidden', 'deleted'] },
        likeCount: { type: 'number' },
        isEdited: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            fullName: { type: 'string', nullable: true },
            avatarUrl: { type: 'string', nullable: true },
          },
        },
        canEdit: { type: 'boolean' },
        canDelete: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async createComment(
    @Param('articleId') articleId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    return this.commentsService.createComment(articleId, userId, createCommentDto);
  }

  @Post('/:commentId/reply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reply to a comment',
    description: 'Add a nested reply to an existing comment. Supports unlimited nesting depth.',
  })
  @ApiParam({
    name: 'commentId',
    description: 'Parent comment UUID',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Reply created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Parent comment not found' })
  @ApiResponse({ status: 400, description: 'Cannot reply to a deleted comment' })
  async createReply(
    @Param('commentId') commentId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    return this.commentsService.createReply(commentId, userId, createCommentDto);
  }

  @Get('/articles/:articleId')
  @Public()
  @ApiOperation({
    summary: 'Get all comments for an article',
    description:
      'Returns all comments for an article in a nested tree structure. Public endpoint.',
  })
  @ApiParam({
    name: 'articleId',
    description: 'Article UUID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        comments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              content: { type: 'string' },
              status: { type: 'string' },
              likeCount: { type: 'number' },
              isEdited: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              user: { type: 'object' },
              canEdit: { type: 'boolean' },
              canDelete: { type: 'boolean' },
              replies: {
                type: 'array',
                description: 'Nested replies (recursive structure)',
              },
            },
          },
        },
        total: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async getArticleComments(@Param('articleId') articleId: string, @Req() req?: any) {
    const userId = req?.user?.sub; // Optional userId for permission checks
    return this.commentsService.getArticleComments(articleId, userId);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a comment',
    description: 'Edit comment content. Only the comment owner or admin can update.',
  })
  @ApiParam({
    name: 'id',
    description: 'Comment UUID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Comment updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not comment owner' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 400, description: 'Cannot edit a deleted comment' })
  async updateComment(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'ADMIN';
    return this.commentsService.updateComment(id, userId, updateCommentDto, isAdmin);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a comment',
    description:
      'Soft delete a comment (marks as deleted, preserves replies). Only the comment owner or admin can delete.',
  })
  @ApiParam({
    name: 'id',
    description: 'Comment UUID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Comment deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        id: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not comment owner' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 400, description: 'Comment already deleted' })
  async deleteComment(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'ADMIN';
    return this.commentsService.deleteComment(id, userId, isAdmin);
  }
}
