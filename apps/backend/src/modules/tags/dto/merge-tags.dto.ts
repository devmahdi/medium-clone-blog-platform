import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MergeTagsDto {
  @ApiProperty({
    description: 'Target tag ID to merge into',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  targetTagId: string;
}
