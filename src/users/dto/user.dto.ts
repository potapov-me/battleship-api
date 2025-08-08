import { User } from 'src/users/schemas/user.schema';

export type UserDto = Omit<User, 'password'>;
