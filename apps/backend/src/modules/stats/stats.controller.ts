import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { GrowthQueryDto } from './dto/growth-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Stats (Admin Only)')
@Controller('admin/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get platform overview statistics',
    description:
      'Returns total counts, user distribution, article status breakdown, and top content (most viewed/clapped/commented articles). Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Overview statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        overview: {
          type: 'object',
          properties: {
            totalUsers: { type: 'number', example: 1250 },
            totalArticles: { type: 'number', example: 340 },
            totalComments: { type: 'number', example: 1560 },
            totalClaps: { type: 'number', example: 8420 },
            totalViews: { type: 'number', example: 45230 },
          },
        },
        usersByRole: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string', example: 'READER' },
              count: { type: 'number', example: 1100 },
            },
          },
        },
        articlesByStatus: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'published' },
              count: { type: 'number', example: 280 },
            },
          },
        },
        topContent: {
          type: 'object',
          properties: {
            mostViewed: {
              type: 'array',
              description: 'Top 10 most viewed articles',
            },
            mostClapped: {
              type: 'array',
              description: 'Top 10 most clapped articles',
            },
            mostCommented: {
              type: 'array',
              description: 'Top 10 most commented articles',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getOverview() {
    return this.statsService.getOverview();
  }

  @Get('growth')
  @ApiOperation({
    summary: 'Get growth statistics over time',
    description:
      'Returns time-series data for users, articles, comments, and claps growth. Data is grouped by day/week/month and suitable for charts. Admin only.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week', 'month'],
    description: 'Time period for grouping (default: day)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: 'string',
    description:
      'Start date in ISO 8601 format (default: 30 days ago)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: 'string',
    description: 'End date in ISO 8601 format (default: now)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Growth statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['day', 'week', 'month'],
          example: 'day',
        },
        startDate: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-31T23:59:59.999Z',
        },
        users: {
          type: 'array',
          description: 'User registrations per period',
          items: {
            type: 'object',
            properties: {
              date: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-15T00:00:00.000Z',
              },
              count: { type: 'number', example: 12 },
            },
          },
        },
        articles: {
          type: 'array',
          description: 'Articles published per period',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date-time' },
              count: { type: 'number' },
            },
          },
        },
        comments: {
          type: 'array',
          description: 'Comments created per period',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date-time' },
              count: { type: 'number' },
            },
          },
        },
        claps: {
          type: 'array',
          description: 'Claps added per period',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date-time' },
              count: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getGrowth(@Query() query: GrowthQueryDto) {
    return this.statsService.getGrowth(query);
  }

  @Get('articles/:id')
  @ApiOperation({
    summary: 'Get analytics for a specific article',
    description:
      'Returns detailed analytics for an article including views, claps, comments, engagement timeline, and top engagers. Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Article UUID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Article analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        article: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Introduction to TypeScript' },
            slug: { type: 'string', example: 'introduction-to-typescript' },
            status: { type: 'string', example: 'published' },
            publishedAt: { type: 'string', format: 'date-time' },
            viewCount: { type: 'number', example: 1520 },
            likeCount: { type: 'number', example: 84 },
            commentCount: { type: 'number', example: 23 },
            readingTimeMinutes: { type: 'number', example: 5 },
            author: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                username: { type: 'string' },
                fullName: { type: 'string' },
              },
            },
          },
        },
        engagement: {
          type: 'object',
          properties: {
            totalViews: { type: 'number', example: 1520 },
            totalClaps: { type: 'number', example: 84 },
            totalComments: { type: 'number', example: 23 },
            averageClapsPerUser: { type: 'number', example: 8 },
          },
        },
        timeline: {
          type: 'object',
          properties: {
            commentsByDate: {
              type: 'array',
              description: 'Comments per day',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date-time' },
                  count: { type: 'number' },
                },
              },
            },
            clapsByDate: {
              type: 'array',
              description: 'Claps per day',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date-time' },
                  count: { type: 'number' },
                },
              },
            },
          },
        },
        topEngagers: {
          type: 'object',
          properties: {
            clappers: {
              type: 'array',
              description: 'Top 10 users who clapped',
              items: {
                type: 'object',
                properties: {
                  userId: { type: 'string', format: 'uuid' },
                  username: { type: 'string' },
                  fullName: { type: 'string' },
                  avatarUrl: { type: 'string' },
                  claps: { type: 'number' },
                },
              },
            },
            commenters: {
              type: 'array',
              description: 'Top 10 users who commented',
              items: {
                type: 'object',
                properties: {
                  userId: { type: 'string', format: 'uuid' },
                  username: { type: 'string' },
                  fullName: { type: 'string' },
                  avatarUrl: { type: 'string' },
                  comments: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async getArticleAnalytics(@Param('id') id: string) {
    return this.statsService.getArticleAnalytics(id);
  }
}
