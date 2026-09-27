import { z } from "zod";

// 面談資料の質問ページ（右パネル）の■は3つなので最大3項目。
// 1項目の上限は、■1つ分の枠に最小サイズまで縮めずに収まる程度に抑えている。
export const ADVICE_MAX_ITEMS = 3;
export const ADVICE_ITEM_MAX_LENGTH = 80;

// 空欄は保存しない（前に詰める）。メンターはアドバイスを入力するまでチャットを
// 開けないので、全部空欄での保存は受け付けない
export const meetingAdviceSchema = z
  .array(z.string(), { error: "アドバイスの形式が不正です。" })
  .max(ADVICE_MAX_ITEMS, `アドバイスは${ADVICE_MAX_ITEMS}項目までです。`)
  .transform((items) => items.map((item) => item.trim()).filter((item) => item !== ""))
  .pipe(
    z
      .array(
        z
          .string()
          .max(
            ADVICE_ITEM_MAX_LENGTH,
            `アドバイスは1項目${ADVICE_ITEM_MAX_LENGTH}文字以内で入力してください。`,
          ),
      )
      .min(1, "アドバイスを1つ以上入力してください。"),
  );
