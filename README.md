# 🚢 Battleship API

REST API для игры "Морской бой" на базе NestJS с использованием MongoDB и Redis.

## 🚀 Возможности

- ✅ Аутентификация и авторизация (JWT)
- ✅ Регистрация с подтверждением email
- ✅ Управление игровыми комнатами
- ✅ Реальная игровая логика "Морской бой"
- ✅ WebSocket поддержка (в разработке)
- ✅ Swagger документация
- ✅ Rate limiting
- ✅ Логирование запросов
- ✅ Health check эндпоинты

## 🛠 Технологии

- **Framework**: NestJS
- **Database**: MongoDB (Mongoose)
- **Cache**: Redis
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Security**: bcrypt, rate limiting, CORS

## 📋 Требования

- Node.js 18+
- MongoDB 5+
- Redis 6+
- npm или yarn

## 🔧 Установка

1. **Клонируйте репозиторий**
```bash
git clone <repository-url>
cd battleship-api
```

2. **Установите зависимости**
```bash
npm install
```

3. **Настройте переменные окружения**
```bash
cp example.env .env
```

Отредактируйте `.env` файл:
```env
# Application
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
PORT=7001
NODE_ENV=development

# Domain
DOMAIN=http://localhost:7001

# Database
MONGO_URI=mongodb://localhost:27017/sea-battle

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Security
SALT_ROUNDS=12
BCRYPT_ROUNDS=12

# Email (configure for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

4. **Запустите базы данных**
```bash
# MongoDB
mongod

# Redis
redis-server
```

5. **Запустите приложение**
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 📚 API Документация

После запуска приложения, Swagger документация доступна по адресу:
```
http://localhost:7001/api
```

## 🧪 Тестирование

```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Все тесты с покрытием
npm run test:all
```

## 🔒 Безопасность

### Реализованные меры безопасности:

- **JWT аутентификация** с настраиваемым временем жизни токенов
- **Хеширование паролей** с использованием bcrypt (12 раундов)
- **Валидация входных данных** с помощью class-validator
- **Rate limiting** для защиты от DDoS атак
- **CORS настройки** для контроля доступа
- **Логирование** всех HTTP запросов
- **Обработка ошибок** без утечки чувствительной информации

### Рекомендации для production:

1. Измените `JWT_SECRET` на сложный случайный ключ
2. Настройте HTTPS
3. Используйте переменные окружения для всех секретов
4. Настройте мониторинг и алерты
5. Регулярно обновляйте зависимости

## 📁 Структура проекта

```
src/
├── auth/                 # Аутентификация и авторизация
├── game/                 # Игровая логика
├── players/              # Управление игроками
├── users/                # Управление пользователями
├── shared/               # Общие сервисы и модели
│   ├── constants/        # Константы
│   ├── interceptors/     # Интерцепторы
│   ├── models/           # Модели данных
│   └── services/         # Общие сервисы
└── main.ts              # Точка входа
```

## 🎮 Игровая логика

### Основные концепции:

1. **Игровые комнаты** - создание и управление игровыми сессиями
2. **Размещение кораблей** - валидация и сохранение позиций
3. **Ходы игроков** - поочередные атаки по полю противника
4. **Проверка победы** - определение победителя

### Состояния игры:

- `WAITING` - ожидание подключения второго игрока
- `ACTIVE` - игра в процессе
- `FINISHED` - игра завершена

## 🔧 Разработка

### Добавление новых эндпоинтов:

1. Создайте DTO с валидацией
2. Добавьте методы в сервис
3. Создайте контроллер с декораторами Swagger
4. Напишите тесты

### Логирование:

Все HTTP запросы автоматически логируются с помощью `LoggingInterceptor`.

### Обработка ошибок:

Используйте встроенные исключения NestJS:
- `BadRequestException` - неверные данные
- `UnauthorizedException` - неавторизованный доступ
- `NotFoundException` - ресурс не найден
- `ConflictException` - конфликт данных

## 🚀 Деплой

### Docker (рекомендуется):

```bash
# Сборка образа
docker build -t battleship-api .

# Запуск контейнера
docker run -p 7001:7001 --env-file .env battleship-api
```

### Docker Compose:

```bash
docker-compose up -d
```

## 📊 Мониторинг

### Health Check:
```
GET / - статус приложения
```

### Метрики:
- Время ответа API
- Количество запросов
- Ошибки и исключения
- Использование памяти

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Внесите изменения
4. Добавьте тесты
5. Создайте Pull Request

## 📄 Лицензия

MIT License

## 🆘 Поддержка

При возникновении проблем:
1. Проверьте логи приложения
2. Убедитесь в корректности конфигурации
3. Создайте issue с подробным описанием проблемы