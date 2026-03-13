import { IsString, IsNotEmpty, IsUUID, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'Great article! Really enjoyed reading this.',
    minLength: 1,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiProperty({
    description: 'Parent comment ID for replies (null for top-level comments)',
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
