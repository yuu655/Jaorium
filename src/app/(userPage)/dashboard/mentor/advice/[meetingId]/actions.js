"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { meetingAdviceSchema } from "@/lib/validation/meetingAdviceSchema";
import { firstValidationError } from "@/lib/validation/profileSchema";

// メンターが面談前に入力する「メンターからのアドバイス」を保存する。
// RLS（meeting_advices）でもその面談のメンター本人しか書けないが、
// エラーメッセージを出し分けるためにここでも先に確認する。
export async function saveMeetingAdvice(meetingId, items) {
  if (!meetingId) return { error: "面談が指定されていません。" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です。" };

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, mentor")
    .eq("id", meetingId)
    .maybeSingle();
  if (!meeting || meeting.mentor !== user.id) {
    return { error: "権限がありません。" };
  }

  const { data: schedule } = await supabase
    .from("meeting_schedules")
    .select("is_finished")
    .eq("meeting_id", meetingId)
    .maybeSingle();
  if (schedule?.is_finished) {
    return { error: "終了した面談のアドバイスは編集できません。" };
  }

  const parsed = meetingAdviceSchema.safeParse(items);
  if (!parsed.success) return { error: firstValidationError(parsed) };

  const { error } = await supabase.from("meeting_advices").upsert(
    {
      meeting_id: meetingId,
      mentor_id: user.id,
      items: parsed.data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "meeting_id" },
  );

  if (error) {
    console.error("saveMeetingAdvice error:", error.message);
    return { error: "アドバイスの保存に失敗しました。" };
  }

  revalidatePath(`/dashboard/mentor/advice/${meetingId}`);
  return { success: true, items: parsed.data };
}
