import { z } from "zod";
import {
  QUOTE_MIN_LENGTH,
  QUOTE_MAX_LENGTH,
  BIO_MIN_LENGTH,
  BIO_MAX_LENGTH,
} from "./profileLimits";

export const userProfileSchema = z.object({
  name: z.string().trim().min(1, "ユーザーネームを入力してください。"),
  grade: z.string().nullable().optional(),
  desire: z.string().nullable().optional(),
});

export const mentorProfileSchema = z.object({
  name: z.string().trim().min(1, "ユーザーネームを入力してください。"),
  university: z.string().trim().min(1, "大学名を入力してください。"),
  faculty: z.string().trim().min(1, "学部名を入力してください。"),
  bio: z
    .string()
    .trim()
    .min(BIO_MIN_LENGTH, `詳細は${BIO_MIN_LENGTH}文字以上で入力してください。`)
    .max(BIO_MAX_LENGTH, `詳細は${BIO_MAX_LENGTH}文字以内で入力してください。`),
  quote: z
    .string()
    .trim()
    .min(QUOTE_MIN_LENGTH, `アピールポイントは${QUOTE_MIN_LENGTH}文字以上で入力してください。`)
    .max(QUOTE_MAX_LENGTH, `アピールポイントは${QUOTE_MAX_LENGTH}文字以内で入力してください。`),
  region: z.string().nullable().optional(),
});

// 各スキーマはfirst errorだけをフォーム上部のFormErrorに出す運用のための取り出し
export function firstValidationError(result) {
  return result.error.issues[0]?.message ?? "入力内容をご確認ください。";
}
