// プロフィール入力欄の文字数制限。クライアント(input属性)とサーバー(zodスキーマ)の
// 両方から参照するプレーンな定数のみを置く（zod等の依存を持ち込まないためのファイル分離）。
export const QUOTE_MIN_LENGTH = 5;
export const QUOTE_MAX_LENGTH = 50;
export const BIO_MIN_LENGTH = 30;
export const BIO_MAX_LENGTH = 500;
