export const MESSAGES = {
  errors: {
    invalidEmail: 'Некорректный email',
    userExistsEmail: 'Пользователь с таким email уже существует',
    userExistsUsername: 'Пользователь с таким username уже существует',
    tokenRequired: 'Требуется токен',
    invalidOrExpiredToken: 'Неверный или просроченный токен',
    emailNotConfirmed: 'Email не подтвержден',
    emailMissing: 'Отсутствует email в объекте пользователя',
    unauthorized: 'Не авторизован',
  },
  auth: {
    confirmEmail: {
      subject: 'Подтверждение email',
      text: (link: string) => `Подтвердите ваш email: ${link}`,
      html: (link: string) =>
        `<p>Подтвердите ваш email по ссылке:</p><p><a href="${link}">${link}</a></p>`,
      success: 'Email подтвержден',
    },
  },
} as const;

export type Messages = typeof MESSAGES;


