export type SentMail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  confirmationLink?: string;
};
