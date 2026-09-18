// メンターの「面談可能日時」と「他の面談で確定済みの枠」を引く共通処理。
// チャット画面・チャットのServer Action・予約フォームの3箇所で同じものが必要になる。
// 確定済み枠は他人の面談のscheduleを見るため、RLSを迂回するadminクライアントを渡す。

import { groupBookedByDate } from "@/lib/schedule";

export async function fetchMentorAvailability(supabase, { mentorId, from }) {
  const { data } = await supabase
    .from("mentor_availabilities")
    .select("date, start_time, end_time")
    .eq("mentor_id", mentorId)
    .gte("date", from);
  return data ?? [];
}

// 同じメンターが「別の面談」で確定済みの日時。ダブルブッキング判定に使う。
// excludeMeetingId を渡すとその面談の枠は除く（まだ面談がない予約フォームでは省略）。
export async function fetchMentorBookedByDate(admin, { mentorId, excludeMeetingId, from }) {
  const { data: mentorMeetings } = await admin.from("meetings").select("id").eq("mentor", mentorId);

  const meetingIds = (mentorMeetings ?? [])
    .map((m) => m.id)
    .filter((id) => id !== excludeMeetingId);

  if (meetingIds.length === 0) return {};

  const { data: schedules } = await admin
    .from("meeting_schedules")
    .select("date, time")
    .in("meeting_id", meetingIds)
    .eq("is_commit", true)
    .eq("is_finished", false)
    .gte("date", from);

  return groupBookedByDate(schedules);
}
