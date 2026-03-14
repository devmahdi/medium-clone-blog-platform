import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { FeedQueryDto, ExploreFeedQueryDto, SortBy } from './dto/feed-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('personalized')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get personalized feed',
    description:
      'Returns articles from authors the authenticated user follows, sorted by recency (newest first)',
  })
  @ApiResponse({
    status: 200,
    description: 'Personalized feed retrieved successfully',
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
              status: { type: 'string', enum: ['draft', 'published', 'archived'] },
              publishedAt: { type: 'string', format: 'date-time', nullable: true },
              viewCount: { type: 'number' },
              likeCount: { type: 'number' },
              commentCount: { type: 'number' },
              readingTimeMinutes: { type: 'number' },
              tags: { type: 'array', items: { type: 'string' } },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  username: { type: 'string' },
                  fullName: { type: 'string', nullable: true },
                  bio: { type: 'string', nullable: true },
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
  async getPersonalizedFeed(@Req() req: any, @Query() query: FeedQueryDto) {
    const userId = req.user.sub; // From JWT payload
    return this.feedService.getPersonalizedFeed(userId, query);
  }

  @Get('explore')
  @Public()
  @ApiOperation({
    summary: 'Get explore feed (global)',
    description:
      'Returns all published articles with configurable sorting: recent (newest first), popular (most likes + views), or trending (recent + popular combined)',
  })
  @ApiQuery({
    name: 'sortBy',
    enum: SortBy,
    required: false,
    description: 'Sort order: recent (default), popular, or trending',
  })
  @ApiResponse({
    status: 200,
    description: 'Explore feed retrieved successfully',
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
              status: { type: 'string', enum: ['draft', 'published', 'archived'] },
              publishedAt: { type: 'string', format: 'date-time', nullable: true },
              viewCount: { type: 'number' },
              likeCount: { type: 'number' },
              commentCount: { type: 'number' },
              readingTimeMinutes: { type: 'number' },
              tags: { type: 'array', items: { type: 'string' } },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  username: { type: 'string' },
                  fullName: { type: 'string', nullable: true },
                  bio: { type: 'string', nullable: true },
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
  async getExploreFeed(@Query() query: ExploreFeedQueryDto, @Req() req?: any) {
    const userId = req?.user?.sub; // Optional, for future use (e.g., personalized explore)
    return this.feedService.getExploreFeed(query, userId);
  }
}
