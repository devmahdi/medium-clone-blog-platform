import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email or username',
    example: 'john.doe@example.com',
  })
  @IsString()
  @IsNotEmpty()
  identifier: string; // Can be email or username

  @ApiProperty({
    description: 'User password',
    example: 'SecureP@ss123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
