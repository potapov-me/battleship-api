# API Регистрации

## Эндпоинт регистрации

### POST /auth/register

Регистрирует нового пользователя в системе.

#### Тело запроса

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### Параметры

- `username` (обязательный, string) - уникальное имя пользователя
- `email` (обязательный, string) - валидный email адрес
- `password` (обязательный, string, минимум 6 символов) - пароль пользователя

#### Успешный ответ (200)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "email": "test@example.com",
    "roles": ["user"]
  }
}
```

#### Ответ с ошибкой (200)

```json
{
  "error": "Пользователь с таким email уже существует"
}
```

или

```json
{
  "error": "Пользователь с таким username уже существует"
}
```

#### Примеры использования

##### cURL

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "password123"
  }'
```

##### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'newuser',
    email: 'newuser@example.com',
    password: 'password123'
  })
});

const data = await response.json();
console.log(data);
```

##### Python (requests)

```python
import requests

response = requests.post('http://localhost:3000/auth/register', json={
    'username': 'newuser',
    'email': 'newuser@example.com',
    'password': 'password123'
})

print(response.json())
```

#### Валидация

- Email должен быть валидным форматом
- Пароль должен содержать минимум 6 символов
- Username и email должны быть уникальными в системе
- Все поля обязательны для заполнения

#### Безопасность

- Пароли хешируются с использованием bcrypt
- JWT токен выдается автоматически после успешной регистрации
- По умолчанию пользователю присваивается роль "user" 