import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Bookmarks')
@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  @ApiOperation({
    summary: 'Bookmark an article',
    description: 'Save an article to user\'s bookmarks for later reading',
  })
  @ApiResponse({
    status: 201,
    description: 'Article bookmarked successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        bookmarkId: { type: 'string', format: 'uuid' },
        postId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({ status: 409, description: 'Article already bookmarked' })
  async createBookmark(
    @Body() createBookmarkDto: CreateBookmarkDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    return this.bookmarksService.createBookmark(userId, createBookmarkDto);
  }

  @Delete('/:articleId')
  @ApiOperation({
    summary: 'Remove bookmark',
    description: 'Remove an article from user\'s bookmarks',
  })
  @ApiParam({
    name: 'articleId',
    description: 'Article UUID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Bookmark removed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        postId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Bookmark not found' })
  async removeBookmark(@Param('articleId') articleId: string, @Req() req: any) {
    const userId = req.user.sub;
    return this.bookmarksService.removeBookmark(userId, articleId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get user\'s bookmarked articles',
    description: 'Returns a paginated list of articles the user has bookmarked',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Bookmarked articles retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              subtitle: { type: 'string', nullable: true },
              excerpt: { type: 'string', nullable: true },
              coverImageUrl: { type: 'string', nullable: true },
              slug: { type: 'string' },
              publishedAt: { type: 'string', format: 'date-time' },
              viewCount: { type: 'number' },
              likeCount: { type: 'number' },
              commentCount: { type: 'number' },
              readingTimeMinutes: { type: 'number' },
              tags: { type: 'array', items: { type: 'string' } },
              bookmarkedAt: {
                type: 'string',
                format: 'date-time',
                description: 'When user bookmarked this article',
              },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  username: { type: 'string' },
                  fullName: { type: 'string', nullable: true },
                  avatarUrl: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
            hasNextPage: { type: 'boolean' },
            hasPreviousPage: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserBookmarks(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    return this.bookmarksService.getUserBookmarks(userId, page, limit);
  }
}
