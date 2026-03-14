import {
  Controller,
  Get,
  Post as HttpPost,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { SearchArticlesDto } from './dto/search-articles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Articles')
@Controller('articles')
@UseGuards(JwtAuthGuard)
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @HttpPost()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new article',
    description: 'Create a new article. Requires authentication. Slug is auto-generated from title.',
  })
  @ApiResponse({
    status: 201,
    description: 'Article created successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors',
  })
  async create(@Request() req, @Body() createPostDto: CreatePostDto) {
    const userId = req.user.sub;
    const article = await this.articlesService.create(userId, createPostDto);
    return {
      data: article,
      message: 'Article created successfully',
    };
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get all articles',
    description:
      'Get paginated list of articles with optional filters (status, tag, author) and sorting (recent, popular, trending). Public endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Articles retrieved successfully',
  })
  async findAll(@Query() queryDto: QueryArticlesDto) {
    return await this.articlesService.findAll(queryDto);
  }

  @Get('search')
  @Public()
  @ApiOperation({
    summary: 'Search articles',
    description: 'Full-text search articles by title and content. Only searches published articles. Public endpoint.',
  })
  @ApiQuery({
    name: 'query',
    description: 'Search query',
    example: 'typescript tutorial',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  async search(@Query() searchDto: SearchArticlesDto) {
    return await this.articlesService.search(searchDto);
  }

  @Get(':slug')
  @Public()
  @ApiOperation({
    summary: 'Get article by slug',
    description: 'Get a single article by its slug. Increments view count. Public endpoint.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Article slug (URL-friendly identifier)',
    example: 'introduction-to-typescript',
  })
  @ApiResponse({
    status: 200,
    description: 'Article retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found',
  })
  async findOne(@Param('slug') slug: string) {
    const article = await this.articlesService.findBySlug(slug);
    return {
      data: article,
    };
  }

  @Patch(':slug')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update article',
    description: 'Update an article. Only the article owner or admin can update. Slug is regenerated if title changes.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Article slug',
    example: 'introduction-to-typescript',
  })
  @ApiResponse({
    status: 200,
    description: 'Article updated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not the article owner or admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found',
  })
  async update(@Param('slug') slug: string, @Request() req, @Body() updatePostDto: UpdatePostDto) {
    const userId = req.user.sub;
    const userRole = req.user.role;
    const article = await this.articlesService.update(slug, userId, userRole, updatePostDto);
    return {
      data: article,
      message: 'Article updated successfully',
    };
  }

  @Delete(':slug')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete article',
    description: 'Soft delete an article (sets status to archived). Only the article owner or admin can delete.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Article slug',
    example: 'introduction-to-typescript',
  })
  @ApiResponse({
    status: 200,
    description: 'Article deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not the article owner or admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found',
  })
  async remove(@Param('slug') slug: string, @Request() req) {
    const userId = req.user.sub;
    const userRole = req.user.role;
    return await this.articlesService.remove(slug, userId, userRole);
  }
}
