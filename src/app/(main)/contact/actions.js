'use server';

import { Resend } from 'resend';
import { z } from 'zod';

const resend = new Resend(process.env.SMTP_API_KEY);

const contactSchema = z.object({
  name: z.string().min(1, '名前を入力してください').max(50),
  email: z.string().email('正しいメールアドレスを入力してください'),
  email_re: z.string().email('正しいメールアドレスを入力してください'),
  message: z.string().min(10, '10文字以上入力してください').max(1000),
});

export async function sendContactEmail(prevState, formData) {
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    email_re: formData.get('email_re'),
    message: formData.get('message'),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, email_re, message } = parsed.data;
  if (email !== email_re) {
    return { errors: { email_re: ['メールアドレスが一致しません。'] } };
  }
  try {
    await resend.emails.send({
      from: 'jaorium_contact@jaorium.com',
      to: 'kazuto335.yama@gmail.com',
      replyTo: email,
      subject: `お問い合わせ: ${name}`,
      html: `
        <p><strong>名前:</strong> ${name}</p>
        <p><strong>メール:</strong> ${email}</p>
        <p><strong>内容:</strong> ${message}</p>
      `,
    });
    return { success: true };
  } catch (error) {
    return { errors: { _form: ['メール送信に失敗しました。しばらく経ってから再度お試しください。'] } };
  }
}