import { IsOptional, IsIn, IsISO8601 } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GrowthQueryDto {
  @ApiPropertyOptional({
    description: 'Time period for grouping (day, week, month)',
    enum: ['day', 'week', 'month'],
    default: 'day',
    example: 'day',
  })
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  period?: 'day' | 'week' | 'month' = 'day';

  @ApiPropertyOptional({
    description: 'Start date (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsISO8601()
  endDate?: string;
}
