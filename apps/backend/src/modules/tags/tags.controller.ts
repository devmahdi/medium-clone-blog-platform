import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { MergeTagsDto } from './dto/merge-tags.dto';
import { QueryTagArticlesDto } from './dto/query-tag-articles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Tags')
@Controller('tags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get all tags',
    description: 'Get list of all tags with article counts, ordered by popularity. Public endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tags retrieved successfully',
  })
  async findAll() {
    const data = await this.tagsService.findAll();
    return { data };
  }

  @Get('trending')
  @Public()
  @ApiOperation({
    summary: 'Get trending tags',
    description:
      'Get trending tags from the last 7 days based on article publication frequency. Public endpoint.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of trending tags to return',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Trending tags retrieved successfully',
  })
  async getTrending(@Query('limit') limit?: number) {
    const data = await this.tagsService.getTrending(limit ? Number(limit) : 10);
    return { data };
  }

  @Get(':tag/articles')
  @Public()
  @ApiOperation({
    summary: 'Get articles by tag',
    description: 'Get paginated list of published articles with a specific tag. Public endpoint.',
  })
  @ApiParam({
    name: 'tag',
    description: 'Tag slug',
    example: 'javascript',
  })
  @ApiResponse({
    status: 200,
    description: 'Articles retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Tag not found',
  })
  async getArticlesByTag(@Param('tag') tag: string, @Query() queryDto: QueryTagArticlesDto) {
    return await this.tagsService.getArticlesByTag(tag, queryDto);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create tag',
    description: 'Create a new tag. Admin only. Slug is auto-generated from name.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tag created successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin role required',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - tag already exists',
  })
  async create(@Body() createTagDto: CreateTagDto) {
    const data = await this.tagsService.create(createTagDto);
    return {
      data,
      message: 'Tag created successfully',
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update tag',
    description: 'Update a tag. Admin only. Slug is regenerated if name changes.',
  })
  @ApiParam({
    name: 'id',
    description: 'Tag ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Tag updated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Tag not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - tag name already exists',
  })
  async update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    const data = await this.tagsService.update(id, updateTagDto);
    return {
      data,
      message: 'Tag updated successfully',
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete tag',
    description: 'Delete a tag. Admin only. Does not affect articles that use this tag.',
  })
  @ApiParam({
    name: 'id',
    description: 'Tag ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Tag deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Tag not found',
  })
  async remove(@Param('id') id: string) {
    return await this.tagsService.remove(id);
  }

  @Post(':id/merge')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Merge tags',
    description:
      'Merge source tag into target tag. Admin only. All articles with source tag will be updated to use target tag. Source tag will be deleted.',
  })
  @ApiParam({
    name: 'id',
    description: 'Source tag ID (will be deleted)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Tags merged successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Tag not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - cannot merge tag into itself',
  })
  async merge(@Param('id') id: string, @Body() mergeDto: MergeTagsDto) {
    const data = await this.tagsService.merge(id, mergeDto);
    return {
      data,
      message: 'Tags merged successfully',
    };
  }
}
