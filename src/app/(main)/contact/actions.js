'use server';

import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { z } from 'zod';
import getUrls from '@/utils/getUrls';

const resend = new Resend(process.env.SMTP_API_KEY);

const SUPPORT_ADDRESS = 'support@jaorium.com';
const NOREPLY_ADDRESS = 'JaoRium <noreply@jaorium.com>';

// 社内向けの通知はZohoのsupport@メールボックスから。
// ユーザー向けの自動返信は送信専用アドレスとしてResendから送り、
// 業務メールのレピュテーションと送信上限を巻き込まないようにする。
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.jp',
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

// 入力値をHTML本文に差し込む前に必ず通す。
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeHtmlMultiline(value) {
  return escapeHtml(value).replaceAll('\n', '<br>');
}

async function sendContactNotificationEmail({ name, email, message }) {
  return transporter.sendMail({
    from: process.env.ZOHO_SMTP_USER,
    to: SUPPORT_ADDRESS,
    replyTo: email,
    subject: `お問い合わせ: ${name}`,
    html: `
      <p><strong>名前:</strong> ${escapeHtml(name)}</p>
      <p><strong>メール:</strong> ${escapeHtml(email)}</p>
      <p><strong>内容:</strong><br>${escapeHtmlMultiline(message)}</p>
    `,
  });
}

async function sendContactConfirmationEmail({ name, email, message }) {
  return resend.emails.send({
    from: NOREPLY_ADDRESS,
    to: email,
    replyTo: SUPPORT_ADDRESS,
    subject: 'お問い合わせを受け付けました',
    // 相手側の自動応答と往復し続けるメールループを防ぐための定型ヘッダー。
    headers: {
      'Auto-Submitted': 'auto-replied',
      Precedence: 'bulk',
    },
    html: `
      <p>${escapeHtml(name)} 様</p>
      <p>お問い合わせいただきありがとうございます。以下の内容で受け付けました。担当者より2〜3営業日以内（土日祝を除く）にご返信します。</p>
      <hr>
      <p><strong>お名前:</strong> ${escapeHtml(name)}</p>
      <p><strong>メールアドレス:</strong> ${escapeHtml(email)}</p>
      <p><strong>お問い合わせ内容:</strong><br>${escapeHtmlMultiline(message)}</p>
      <hr>
      <p>このメールは送信専用アドレスから配信していますが、そのままご返信いただければ ${SUPPORT_ADDRESS} に届きます。</p>
      <p><a href="${getUrls()}">JaoRium</a></p>
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
  } catch (error) {
    return { errors: { _form: ['メール送信に失敗しました。しばらく経ってから再度お試しください。'] } };
  }

  // 確認メールが届かなくても問い合わせ自体は受理済みなので、送信結果は成功のまま返す。
  try {
    const { error } = await sendContactConfirmationEmail({ name, email, message });
    if (error) {
      console.error('お問い合わせ確認メールの送信に失敗しました', error);
    }
  } catch (error) {
    console.error('お問い合わせ確認メールの送信に失敗しました', error);
  }

  return { success: true };
}
