export type UserDto = {
  id: string;
  username: string;
  email: string;
  password: string;
  roles: string[];
};

export type UserResponseDto = {
  id: string;
  username: string;
  email: string;
  roles: string[];
};
