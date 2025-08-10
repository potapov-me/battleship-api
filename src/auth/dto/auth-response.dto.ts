import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT токен для аутентификации',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;
}

export class RegisterResponseDto {
  @ApiProperty({
    description: 'JWT токен для аутентификации',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Информация о пользователе',
    example: {
      id: '507f1f77bcf86cd799439011',
      username: 'john_doe',
      email: 'john.doe@example.com',
      roles: ['user'],
    },
  })
  user: {
    id: string;
    username: string;
    email: string;
    roles: string[];
  };
}

export class ProfileResponseDto {
  @ApiProperty({
    description: 'Имя пользователя',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: 'Email пользователя',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Роли пользователя',
    example: ['user'],
    type: [String],
  })
  roles: string[];
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Сообщение об ошибке',
    example: 'Некорректный email или пароль',
  })
  message: string;

  @ApiProperty({
    description: 'Код ошибки',
    example: 'UNAUTHORIZED',
  })
  error: string;

  @ApiProperty({
    description: 'HTTP статус код',
    example: 401,
  })
  statusCode: number;
}
