import { User } from '../models/user.models';

export type UserDto = Omit<User, 'password'>;
