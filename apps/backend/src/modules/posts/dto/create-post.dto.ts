import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsBoolean, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PostStatus } from '../entities/post.entity';

export class CreatePostDto {
  @ApiProperty({
    description: 'Post title',
    example: 'The Future of Web Development in 2026',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Post subtitle',
    example: 'Exploring the latest trends and technologies',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  subtitle?: string;

  @ApiProperty({
    description: 'Post content (Markdown or rich text)',
    example: '# Introduction\n\nThis is the content of my blog post...',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content: string;

  @ApiProperty({
    description: 'Short excerpt or summary of the post',
    example: 'A brief overview of web development trends in 2026',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiProperty({
    description: 'Cover image URL',
    example: 'https://example.com/images/cover.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiProperty({
    description: 'Post status',
    enum: PostStatus,
    default: PostStatus.DRAFT,
    required: false,
  })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiProperty({
    description: 'Post tags',
    example: ['web-development', 'javascript', 'nextjs'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'Allow comments on this post',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;
}
