import { IsString, IsNotEmpty, IsEmail, Matches } from 'class-validator';

export class LoginDto {
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
  @IsString()
  @Matches(
    /^(?!.*\.\.)[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/,
    { message: 'Некорректный email' },
  )
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
