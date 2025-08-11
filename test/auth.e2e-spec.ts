import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/schemas/user.schema';
import { Model } from 'mongoose';
import { MESSAGES } from '../src/shared/constants/messages';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    await app.init();
  });

  afterAll(async () => {
    // Очистка пользователей после завершения e2e-сьюта
    try {
      await userModel.deleteMany({}).exec();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to clear users after e2e tests:', (error as Error).message);
    }
    await app.close();
  });

  beforeEach(async () => {
    await userModel.deleteMany({}).exec();
  });

  describe('/auth/register (POST)', () => {
    it('should reject invalid emails (register)', async () => {
      const invalidEmails = [
        'plainaddress',
        '@nouser.com',
        'user@',
        'user@no-tld',
        'user@.invalid.com',
        'user..dots@example.com',
        'user@example',
        'user@example..com',
        ' user@example.com ',
        'consta!!ntin@potapov.me',
      ];

      for (const email of invalidEmails) {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            username: 'u_' + Math.random().toString(36).slice(2, 7),
            email,
            password: 'Password123',
          })
          .expect(400);

        expect(res.body).toHaveProperty('message');
        const message = res.body.message;
        if (Array.isArray(message)) {
          expect(message.join(' ')).toMatch(
            new RegExp(MESSAGES.errors.invalidEmail + '|email', 'i'),
          );
        } else {
          expect(String(message)).toMatch(
            new RegExp(MESSAGES.errors.invalidEmail + '|email', 'i'),
          );
        }
      }
    });

    it('should register a new user successfully', async () => {
      const registerData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(registerData.username);
      expect(response.body.user.email).toBe(registerData.email);
      expect(response.body.user).not.toHaveProperty('password');

      // Проверяем, что пользователь сохранен в базе данных
      const savedUser = await userModel
        .findOne({ email: registerData.email })
        .exec();
      expect(savedUser).toBeDefined();
      expect(savedUser).not.toBeNull();
      if (savedUser) {
        expect(savedUser.username).toBe(registerData.username);
        expect(savedUser.email).toBe(registerData.email);
        expect(savedUser.roles).toContain('user');
      }
    });

    it('should return error when registering with existing email', async () => {
      // Сначала регистрируем пользователя
      const firstUser = {
        username: 'firstuser',
        email: 'existing@example.com',
        password: 'Password123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(firstUser)
        .expect(201);

      // Пытаемся зарегистрировать второго пользователя с тем же email
      const secondUser = {
        username: 'seconduser',
        email: 'existing@example.com',
        password: 'Password456',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(secondUser)
        .expect(409); // API возвращает 409 для конфликтов

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe(MESSAGES.errors.userExistsEmail);
    });

    it('should return error when registering with existing username', async () => {
      // Сначала регистрируем пользователя
      const firstUser = {
        username: 'existinguser',
        email: 'first@example.com',
        password: 'Password123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(firstUser)
        .expect(201);

      // Пытаемся зарегистрировать второго пользователя с тем же username
      const secondUser = {
        username: 'existinguser',
        email: 'second@example.com',
        password: 'Password456',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(secondUser)
        .expect(409); // API возвращает 409 для конфликтов

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe(MESSAGES.errors.userExistsUsername);
    });

    it('should handle special characters in username', async () => {
      // Разрешенные символы: буквы, цифры, точка, дефис, подчеркивание (без подряд и без них в начале/конце)
      const okUsernames = [
        'test_user-123',
        'user.name',
        'user-name',
        'user_name',
      ];
      for (const username of okUsernames) {
        const registerData = {
          username,
          email: `${username.replace(/[^a-z0-9]/gi, '')}_${Math.random()
            .toString(36)
            .slice(2, 7)}@example.com`,
          password: 'Password123',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(registerData)
          .expect(201);

        expect(response.body).toHaveProperty('access_token');
        expect(response.body.user.username).toBe(registerData.username);
      }
    });

    it('should reject invalid username with special symbols or consecutive specials', async () => {
      const badUsernames = [
        'potapov!!',
        '.startsWithDot',
        '-startsWithDash',
        'endsWithDot.',
        'double..dot',
        'name__two',
        'name--two',
      ];
      for (const username of badUsernames) {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            username,
            email: `ok_${Math.random().toString(36).slice(2, 7)}@example.com`,
            password: 'Password123',
          })
          .expect(400);

        expect(res.body).toHaveProperty('message');
        const message = res.body.message;
        expect(
          String(Array.isArray(message) ? message.join(' ') : message),
        ).toMatch(/username|Некорректный username/i);
      }
    });

    it('should handle long password', async () => {
      const registerData = {
        username: 'longpassuser',
        email: 'longpass@example.com',
        password: 'VeryLongPasswordWithManyCharacters123!@#$%^&*()',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.username).toBe(registerData.username);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Регистрируем тестового пользователя
      const registerData = {
        username: 'logintest',
        email: 'login@example.com',
        password: 'Password123',
      };

      const regRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData);
      // Получаем токен подтверждения из базы
      const registered = await userModel
        .findOne({ email: registerData.email })
        .exec();
      const token = registered?.emailConfirmationToken;
      expect(token).toBeTruthy();
      await request(app.getHttpServer())
        .get(`/auth/confirm-email`)
        .query({ token })
        .expect(200);
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'Password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(200); // API возвращает 201 для успешного логина

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
      expect(response.body.access_token.length).toBeGreaterThan(0);
    });

    it('should return error with invalid email', async () => {
      const invalidEmails = [
        'plainaddress',
        'user@',
        '@nouser.com',
        'user@example',
        'user@example..com',
        ' user@example.com ',
        'consta!!ntin@potapov.me',
      ];

      for (const email of invalidEmails) {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email, password: 'Password123' })
          .expect(400);

        expect(response.body).toHaveProperty('message');
        const message = response.body.message;
        if (Array.isArray(message)) {
          expect(message.join(' ')).toMatch(
            new RegExp(MESSAGES.errors.invalidEmail + '|email', 'i'),
          );
        } else {
          expect(String(message)).toMatch(
            new RegExp(MESSAGES.errors.invalidEmail + '|email', 'i'),
          );
        }
      }
    });

    it('should return error with invalid password', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe(MESSAGES.errors.unauthorized);
    });
  });

  describe('/auth/profile (GET)', () => {
    let authToken: string;

    beforeEach(async () => {
      // Регистрируем и логиним пользователя
      const registerData = {
        username: 'profiletest',
        email: 'profile@example.com',
        password: 'Password123',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData);
      const saved = await userModel
        .findOne({ email: registerData.email })
        .exec();
      const token = saved?.emailConfirmationToken;
      await request(app.getHttpServer())
        .get(`/auth/confirm-email`)
        .query({ token })
        .expect(200);

      authToken = registerResponse.body.access_token;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('username');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('roles');
      expect(response.body.username).toBe('profiletest');
      expect(response.body.email).toBe('profile@example.com');
      expect(response.body.roles).toContain('user');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return error with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe(MESSAGES.errors.unauthorized);
    });

    it('should return error without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Unauthorized');
    });
  });

  describe('Full authentication flow', () => {
    it('should complete full registration and login flow', async () => {
      // Шаг 1: Регистрация
      const registerData = {
        username: 'flowtest',
        email: 'flow@example.com',
        password: 'Password123',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('access_token');
      expect(registerResponse.body).toHaveProperty('user');
      expect(registerResponse.body.user.username).toBe(registerData.username);

      const saved = await userModel
        .findOne({ email: registerData.email })
        .exec();
      const token = saved?.emailConfirmationToken;
      await request(app.getHttpServer())
        .get(`/auth/confirm-email`)
        .query({ token })
        .expect(200);

      const authToken = registerResponse.body.access_token;

      // Шаг 2: Получение профиля
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.username).toBe(registerData.username);
      expect(profileResponse.body.email).toBe(registerData.email);

      // Шаг 3: Повторный логин
      const loginData = {
        email: registerData.email,
        password: registerData.password,
      };

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(loginResponse.body).toHaveProperty('access_token');
      expect(typeof loginResponse.body.access_token).toBe('string');

      // Шаг 4: Проверяем, что новый токен валиден
      expect(loginResponse.body.access_token).toBeDefined();
      expect(typeof loginResponse.body.access_token).toBe('string');
      expect(loginResponse.body.access_token.length).toBeGreaterThan(0);
    });
  });
});
