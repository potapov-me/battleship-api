import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Имя пользователя',
    example: 'john_doe',
    minLength: 3,
    maxLength: 30,
  })
  @IsNotEmpty()
  @IsString()
  @Length(3, 30, { message: 'Username должен быть от 3 до 30 символов' })
  @Matches(
    /^(?!.*[._-]{2})[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])$/,
    {
      message:
        'Некорректный username: разрешены буквы, цифры, точки, дефисы и подчеркивания; без подряд идущих спецсимволов и без них в начале/конце',
    },
  )
  username: string;

  @ApiProperty({
    description: 'Email пользователя',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail(
    {
      allow_display_name: false,
      allow_utf8_local_part: false,
      allow_ip_domain: false,
      domain_specific_validation: true,
      require_tld: true,
    },
    { message: 'Некорректный email' },
  )
  @Matches(
    /^(?!.*\.\.)[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/,
    { message: 'Некорректный email' },
  )
  email: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'Password123!',
    minLength: 8,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Пароль должен содержать хотя бы одну строчную букву, одну заглавную букву и одну цифру',
  })
  password: string;
}
