# Документация API игровой логики

## Обзор

API игровой логики предоставляет полный набор эндпоинтов для управления игровым процессом в игре "Морской бой". Все эндпоинты защищены JWT аутентификацией.

## Аутентификация

Все запросы к API должны содержать заголовок `Authorization: Bearer <JWT_TOKEN>`.

## Основные эндпоинты

### 1. Управление играми (`/game`)

#### Создание игры
```http
POST /game/create
Content-Type: application/json

{
  "player1Id": "507f1f77bcf86cd799439011",
  "player2Id": "507f1f77bcf86cd799439012"
}
```

**Ответ:**
```json
{
  "id": "game123",
  "status": "waiting",
  "player1Id": "507f1f77bcf86cd799439011",
  "player2Id": "507f1f77bcf86cd799439012",
  "currentPlayerId": "507f1f77bcf86cd799439011"
}
```

#### Размещение кораблей
```http
POST /game/place-ships
Content-Type: application/json

{
  "gameId": "game123",
  "userId": "507f1f77bcf86cd799439011",
  "ships": [
    {
      "x": 0,
      "y": 0,
      "type": "battleship",
      "direction": "horizontal"
    },
    {
      "x": 2,
      "y": 2,
      "type": "cruiser",
      "direction": "vertical"
    }
  ]
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Корабли размещены успешно"
}
```

#### Выполнение выстрела
```http
POST /game/make-shot
Content-Type: application/json

{
  "gameId": "game123",
  "userId": "507f1f77bcf86cd799439011",
  "x": 5,
  "y": 3
}
```

**Ответ:**
```json
{
  "hit": true,
  "sunk": false,
  "gameOver": false
}
```

#### Получение информации об игре
```http
GET /game/{gameId}
```

**Ответ:**
```json
{
  "id": "game123",
  "status": "active",
  "player1Id": "507f1f77bcf86cd799439011",
  "player2Id": "507f1f77bcf86cd799439012",
  "currentPlayerId": "507f1f77bcf86cd799439011",
  "winnerId": null
}
```

#### Получение игр игрока
```http
GET /game/player/{playerId}
```

#### Получение активных игр
```http
GET /game/active/list
```

#### Сдача в игре
```http
POST /game/{gameId}/surrender
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439011"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Игрок сдался",
  "winnerId": "507f1f77bcf86cd799439012"
}
```

### 2. Управление комнатами (`/rooms`)

#### Создание комнаты
```http
POST /rooms
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439011",
  "name": "Комната для поиска игроков"
}
```

#### Присоединение к комнате
```http
POST /rooms/{roomId}/join
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439012"
}
```

#### Получение списка активных комнат
```http
GET /rooms
```

#### Получение информации о комнате
```http
GET /rooms/{roomId}
```

#### Покидание комнаты
```http
POST /rooms/{roomId}/leave
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439011"
}
```

### 3. Статистика игр (`/game-stats`)

#### Статистика игрока
```http
GET /game-stats/player/{playerId}
```

**Ответ:**
```json
{
  "playerId": "507f1f77bcf86cd799439011",
  "totalGames": 25,
  "wins": 15,
  "losses": 8,
  "draws": 2,
  "winRate": 60.0,
  "averageGameDuration": 1800,
  "totalShots": 150,
  "accuracy": 75.5
}
```

#### Таблица лидеров
```http
GET /game-stats/leaderboard?limit=10
```

**Ответ:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "playerId": "player1",
      "username": "Player1",
      "wins": 25,
      "totalGames": 30,
      "winRate": 83.3
    }
  ]
}
```

#### Статистика конкретной игры
```http
GET /game-stats/game/{gameId}/stats
```

#### Глобальная статистика
```http
GET /game-stats/global/stats
```

## Коды ответов

- `200` - Успешный запрос
- `201` - Ресурс создан
- `400` - Неверные параметры запроса
- `401` - Не авторизован
- `404` - Ресурс не найден

## Обработка ошибок

Все ошибки возвращаются в формате:

```json
{
  "statusCode": 400,
  "message": "Описание ошибки",
  "error": "Bad Request"
}
```

## Логирование

Все действия логируются для аудита и отладки. Логи включают:
- Создание игр
- Размещение кораблей
- Выполнение выстрелов
- Присоединение к комнатам
- Статистические запросы

## Безопасность

- Все эндпоинты защищены JWT аутентификацией
- Валидация входных данных
- Проверка прав доступа к играм
- Аудит всех игровых действий

## Примеры использования

### Полный цикл игры

1. **Создание игры:**
```bash
curl -X POST http://localhost:3000/game/create \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"player1Id": "player1", "player2Id": "player2"}'
```

2. **Размещение кораблей игроком 1:**
```bash
curl -X POST http://localhost:3000/game/place-ships \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"gameId": "game123", "userId": "player1", "ships": [...]}'
```

3. **Размещение кораблей игроком 2:**
```bash
curl -X POST http://localhost:3000/game/place-ships \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"gameId": "game123", "userId": "player2", "ships": [...]}'
```

4. **Выполнение выстрелов по очереди:**
```bash
curl -X POST http://localhost:3000/game/make-shot \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"gameId": "game123", "userId": "player1", "x": 5, "y": 3}'
```

5. **Получение статистики:**
```bash
curl -X GET http://localhost:3000/game-stats/player/player1 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## Примечания

- Все координаты начинаются с 0
- Размер доски по умолчанию: 10x10
- Корабли не могут пересекаться или касаться углами
- Игра автоматически завершается при уничтожении всех кораблей противника
- Ходы передаются по очереди между игроками

## Типы кораблей

Доступные типы кораблей для размещения:

- `carrier` - Авианосец (5 клеток)
- `battleship` - Броненосец (4 клетки)  
- `cruiser` - Крейсер (3 клетки)
- `submarine` - Подводная лодка (3 клетки)
- `destroyer` - Эсминец (2 клетки)

## Направления кораблей

- `horizontal` - Горизонтальное размещение
- `vertical` - Вертикальное размещение
