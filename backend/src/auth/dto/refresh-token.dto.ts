import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh JWT token' })
  @IsString()
  @IsJWT()
  refreshToken!: string;
}
