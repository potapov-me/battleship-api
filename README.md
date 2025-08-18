# 🚢 Battleship API

API для игры "Морской бой" на NestJS с React, Redis и MongoDB.

## ✨ Особенности

- 🔐 JWT аутентификация с Passport
- 🎮 Полноценная игровая логика "Морской бой"
- ⚛️ React клиент
- 📊 Redis для кэширования и управления состоянием игр
- 🗄️ MongoDB для хранения пользователей
- 📧 Email уведомления
- 🚦 Rate limiting и защита от DDoS
- 📝 Swagger документация
- 🧪 Полное покрытие тестами
- 🐳 Docker поддержка

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- Docker и Docker Compose
- Redis 6+
- MongoDB 5+

### Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/your-username/battleship-api.git
cd battleship-api
```

2. Установите зависимости для API:
```bash
npm install
```

3. Установите зависимости для клиента:
```bash
cd client
npm install
cd ..
```

4. Скопируйте файл с переменными окружения:
```bash
cp example.env .env
```

5. Настройте переменные окружения в `.env`:
```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/battleship
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-here
```

### Запуск

#### Локальный запуск (без Docker)

1. Запустите MongoDB и Redis.
2. Запустите API:
```bash
npm run start:dev
```
3. Запустите клиент:
```bash
cd client
npm run dev
```

API будет доступно по адресу `http://localhost:3000`, а клиент по адресу `http://localhost:5173`.

#### Запуск с помощью Docker Compose

1. Запустите все сервисы:
```bash
docker-compose up -d
```

API будет доступно по адресу `http://localhost:3000`, клиент по адресу `http://localhost:3001`, а Mongo Express по адресу `http://localhost:8081`.

## 📚 API Документация

После запуска приложения Swagger документация доступна по адресу:
- http://localhost:3000/api

## 🏗️ Архитектура

### Модули

- **AuthModule** - Аутентификация и авторизация
- **UsersModule** - Управление пользователями
- **GameModule** - Игровая логика
- **SharedModule** - Общие сервисы (Redis, Game Engine, etc.)

### Сервисы

- **GameEngineService** - Основная игровая логика
- **GameStateManagerService** - Управление состоянием игр в Redis
- **RedisService** - Работа с Redis с кэшированием
- **AuthService** - Аутентификация и JWT токены

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `NODE_ENV` | Окружение | `development` |
| `PORT` | Порт приложения | `3000` |
| `MONGO_URI` | URI MongoDB | - |
| `REDIS_HOST` | Хост Redis | `localhost` |
| `REDIS_PORT` | Порт Redis | `6379` |
| `JWT_SECRET` | Секретный ключ JWT | - |
| `JWT_EXPIRES_IN` | Время жизни JWT | `24h` |

### Redis

Redis используется для:
- Кэширования игровых состояний
- Управления активными играми
- Индексов для быстрого поиска

### MongoDB

MongoDB используется для:
- Хранения пользователей
- Аудита действий
- Статистики игр

## 🧪 Тестирование

```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Покрытие кода
npm run test:cov

# Все тесты
npm run test:all
```

## 🚀 Production

### Docker

```bash
# Сборка образа
docker build -t battleship-api .

# Запуск
docker run -p 3000:3000 battleship-api
```

### Переменные для Production

```env
NODE_ENV=production
JWT_SECRET=<strong-secret-key>
REDIS_PASSWORD=<redis-password>
MONGO_URI=<production-mongo-uri>
```

## 🔒 Безопасность

- JWT токены с ограниченным временем жизни
- Rate limiting для защиты от DDoS
- Валидация всех входных данных
- Аудит всех действий пользователей
- Защита от SQL инъекций

## 📝 Лицензия

UNLICENSED

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📞 Поддержка

При возникновении проблем создайте issue в репозитории.
