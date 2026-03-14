import { IsOptional, IsEnum, IsString, IsInt, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PostStatus } from '../entities/post.entity';

export enum ArticleSortBy {
  RECENT = 'recent',
  POPULAR = 'popular',
  TRENDING = 'trending',
}

export class QueryArticlesDto {
  @ApiProperty({
    description: 'Page number (1-indexed)',
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Filter by post status',
    enum: PostStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiProperty({
    description: 'Filter by tag',
    example: 'javascript',
    required: false,
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiProperty({
    description: 'Filter by author ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiProperty({
    description: 'Sort strategy',
    enum: ArticleSortBy,
    default: ArticleSortBy.RECENT,
    required: false,
  })
  @IsOptional()
  @IsEnum(ArticleSortBy)
  sortBy?: ArticleSortBy = ArticleSortBy.RECENT;
}
