'use server';

import nodemailer from 'nodemailer';
import { z } from 'zod';

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_SMTP_USER,
    pass: process.env.ZOHO_SMTP_PASSWORD,
  },
});

const contactSchema = z.object({
  name: z.string().min(1, '名前を入力してください').max(50),
  email: z.string().email('正しいメールアドレスを入力してください'),
  email_re: z.string().email('正しいメールアドレスを入力してください'),
  message: z.string().min(10, '10文字以上入力してください').max(1000),
});

function parseContactForm(formData) {
  return contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    email_re: formData.get('email_re'),
    message: formData.get('message'),
  });
}

async function sendContactNotificationEmail({ name, email, message }) {
  return transporter.sendMail({
    from: process.env.ZOHO_SMTP_USER,
    to: 'support@jaorium.com',
    replyTo: email,
    subject: `お問い合わせ: ${name}`,
    html: `
      <p><strong>名前:</strong> ${name}</p>
      <p><strong>メール:</strong> ${email}</p>
      <p><strong>内容:</strong> ${message}</p>
    `,
  });
}

export async function sendContactEmail(prevState, formData) {
  const parsed = parseContactForm(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, email_re: emailConfirmation, message } = parsed.data;
  if (email !== emailConfirmation) {
    return { errors: { email_re: ['メールアドレスが一致しません。'] } };
  }

  try {
    await sendContactNotificationEmail({ name, email, message });
    return { success: true };
  } catch (error) {
    return { errors: { _form: ['メール送信に失敗しました。しばらく経ってから再度お試しください。'] } };
  }
}
