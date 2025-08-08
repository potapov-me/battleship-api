export class User {
  id: number; // Уникальный идентификатор пользователя
  username: string; // Имя пользователя
  email?: string; // Email (опционально)
  password: string; // Хеш пароля (bcrypt)
  // Можно добавить дополнительные поля: рейтинг, статус,
  roles: string[]; // Права юзера
}
