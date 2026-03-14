import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ClapDto {
  @ApiPropertyOptional({
    description: 'Number of claps to add (1-50 total per user per article)',
    minimum: 1,
    maximum: 50,
    default: 1,
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  count?: number = 1;
}
