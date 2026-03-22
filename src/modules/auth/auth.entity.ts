import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../users/entities/user.entity';

export class AuthResponse {
  @ApiProperty({ description: 'The JWT access token' })
  access_token: string;

  @ApiProperty({ type: UserEntity, description: 'The user information' })
  user: UserEntity;
}

export class MessageResponse {
  @ApiProperty({
    description: 'A message indicating the result of the operation',
  })
  message: string;
}
