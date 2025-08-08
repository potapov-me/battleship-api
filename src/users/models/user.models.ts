export class User {
  id: number; // Уникальный идентификатор пользователя
  username: string; // Имя пользователя
  email?: string; // Email (опционально)
  createdAt: Date; // Дата регистрации
  password: string; // Хеш пароля (bcrypt)
  // Можно добавить дополнительные поля: рейтинг, статус,
}
