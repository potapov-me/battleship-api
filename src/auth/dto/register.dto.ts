import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  Length,
} from 'class-validator';

export class RegisterDto {
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

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
