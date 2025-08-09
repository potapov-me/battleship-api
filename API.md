## Battleship API

Описание REST API для аутентификации, пользователей, комнат и игры.

### Аутентификация

- POST `/auth/register`
  - Тело: `{ username: string, email: string, password: string }`
  - Ответ 201: `{ access_token: string, user: { username, email, roles } }`
  - Ошибки 400: сообщения валидации (email/username)
  - Примечание: для подтверждения email используется GET `/auth/confirm-email?token=...`

- GET `/auth/confirm-email?token=...`
  - Успех 200: `{ message: 'Email подтвержден' }`
  - Ошибки 200: `{ error: 'Требуется токен' | 'Неверный или просроченный токен' }`

- POST `/auth/login`
  - Тело: `{ email: string, password: string }`
  - Успех 201: `{ access_token: string }`
  - Ошибка 400: валидация email
  - Ошибка 401: `{ message: 'Не авторизован' }` (неверные учетные данные)

- POST `/auth/profile`
  - Заголовок: `Authorization: Bearer <JWT>`
  - Успех 201: `{ username, email, roles }`
  - Ошибка 401:
    - `{ message: 'Unauthorized' }` — если токен отсутствует
    - `{ message: 'Не авторизован' }` — если токен невалиден/просрочен

- GET `/auth/password/:password`
  - Успех 200: строка или объект с хешем пароля (для отладки)

### Комнаты (Rooms)

- POST `/rooms`
  - Тело: `{ userId: string, name?: string }`
  - Успех 201: `Room` — `{ id, name, creatorId, opponentId?, status, createdAt, startedAt?, finishedAt? }`

- POST `/rooms/:id/join`
  - Тело: `{ userId: string }`
  - Успех 201: `Room`
  - Ошибки 404: `Room not found`
  - Ошибки 400: `Room is not joinable` | `Creator cannot join their own room as opponent` | `Room already has an opponent`

- GET `/rooms`
  - Успех 200: `{ rooms: Room[] }` — только комнаты в статусе `waiting`

Статусы комнат: `waiting` | `active` | `finished`.

### Игра (заготовки)

- POST `/game` — создание игры (внутренняя логика заготовлена)
- Прочие эндпоинты для расстановки кораблей/стрельбы предполагаются, но пока не реализованы в контроллере.

### Ответы об ошибках

- Формат ошибок следует стандарту NestJS: `{ statusCode, message, error }`, либо объект `{ error: string }` для некоторых контроллеров.
- Ключевые сообщения:
  - `Не авторизован` — ошибки авторизации
  - `Требуется токен`, `Неверный или просроченный токен` — подтверждение email
  - Сообщения валидации email/username

### Примечания

- В текущей реализации комнаты хранятся в памяти процесса. Для продакшена используйте Redis/БД.
- JWT секрет читается из `JWT_SECRET` (см. `.env`).


