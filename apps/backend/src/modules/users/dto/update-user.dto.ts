import { IsString, IsOptional, MaxLength, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John M. Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiProperty({
    description: 'User biography',
    example: 'Passionate writer and developer interested in web technologies.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({
    description: 'Profile avatar URL',
    example: 'https://example.com/avatars/user.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
