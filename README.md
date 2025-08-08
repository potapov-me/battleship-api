## Battleship API (NestJS)

Небольшой REST API для игры «Морской бой» на NestJS. В текущей версии реализована аутентификация и регистрация пользователей в MongoDB (Mongoose) с JWT. Модули игры и комнат подготовлены в виде заглушек.

### Технологии
- **Runtime**: Node.js 22
- **Framework**: NestJS 11 (TypeScript)
- **База данных**: MongoDB (Mongoose)
- **Аутентификация**: Passport (local, JWT)

## Быстрый старт
1) Установите зависимости:
```bash
npm install
```

2) Скопируйте `.env`:
```bash
cp example.env .env
```
Отредактируйте переменные по необходимости (ниже см. «Переменные окружения»). По умолчанию приложение слушает порт `3000`, если `PORT` не задан.

3) Поднимите MongoDB (любой способ):
- Docker Compose (из репозитория):
```bash
docker compose up -d mongo express
```
- Локально установленный MongoDB: убедитесь, что доступен `mongodb://localhost:27017`.

4) Запуск в dev-режиме:
```bash
npm run start:dev
```
Приложение будет доступно на `http://localhost:3000` (или на значении `PORT` из `.env`).

## Переменные окружения
Поддерживаются следующие переменные (`example.env` содержит базовые значения):
- `JWT_SECRET` — секрет для подписи JWT (обязательно)
- `PORT` — порт HTTP-сервера (по умолчанию 3000)
- `MONGO_URI` — строка подключения к MongoDB (например, `mongodb://localhost:27017/sea-battle`)
- `SALT_ROUNDS` — количество раундов соли для bcrypt (необязательно, по умолчанию 10)

## Скрипты npm
- `start` — запуск prod-сборки
- `start:dev` — запуск с вотчером
- `build` — сборка TypeScript
- `test` — юнит-тесты
- `test:e2e` — e2e-тесты
- `test:all` — юнит + e2e
- `lint` — ESLint с авто-чином
- `format` — Prettier форматирование
- `check:main-db` — проверка подключения к основной БД (`scripts/check-main-db.js`)

## API
### Аутентификация (`/auth`)
- `POST /auth/register` — регистрация нового пользователя
  - Тело: `{ username: string, email: string, password: string }`
  - Успех: `{ access_token: string, user: { id, username, email, roles } }`
  - Ошибки: `{ error: string }`
  - Примечание: в текущей реализации ошибки регистрации возвращаются со статусом 201 и полем `error` в теле ответа (см. `REGISTRATION_API.md`).

- `POST /auth/login` — логин по email/паролю
  - Тело: `{ email: string, password: string }`
  - Успех: `{ access_token: string }`
  - Ошибка: `401 Unauthorized`

- `POST /auth/profile` — профиль пользователя (требуется JWT `Authorization: Bearer <token>`)
  - Успех: `{ username, email, roles }`
  - Ошибка: `401 Unauthorized`

- `GET /auth/password/:password` — утилитарный эндпоинт для получения хеша пароля (dev)
  - Успех: строка-хеш (или объект в зависимости от реализации сериализации)

Подробная спецификация регистрации: см. `REGISTRATION_API.md` и краткое резюме — `REGISTRATION_SUMMARY.md`.

### Комнаты (`/rooms`) — заглушки
- `POST /rooms` — создать комнату
- `POST /rooms/:id/join` — присоединиться к комнате
- `GET /rooms` — список активных комнат (пока возвращает пустой массив)

### Игра
Интерфейсы и сервисы подготовлены, но прикладная логика и WebSocket-шлюзы пока не реализованы.

## Тестирование
```bash
npm run test       # юнит-тесты
npm run test:e2e   # e2e-тесты
```
Тесты используют отдельную тестовую БД MongoDB на localhost:27017. Убедитесь, что MongoDB доступен локально перед запуском e2e.

## Docker
### Сборка прод-образа
```bash
docker build -t battleship-api .
```
Запуск:
```bash
docker run --rm -p 3000:3000 \
  -e PORT=3000 \
  -e JWT_SECRET=GLADIUS \
  -e MONGO_URI="mongodb://host.docker.internal:27017/sea-battle" \
  battleship-api
```

### Docker Compose (зависимости)
В `docker-compose.yml` описаны сервисы `mongo`, `mongo-express`, `postgres`, `redis`. Для текущей версии приложения достаточно поднять `mongo` (и опционально `mongo-express`). Блок сервиса приложения закомментирован.

## План и дальнейшая работа
Краткий план задач хранится в `plan.md`. Ближайшие шаги:
- Убрать заглушки в `RoomService` и реализовать хранение комнат
- Добавить игровую механику и валидацию кораблей
- Подключить WebSocket-шлюз для реального времени

## Лицензия
Проект распространяется без лицензии (`UNLICENSED`).