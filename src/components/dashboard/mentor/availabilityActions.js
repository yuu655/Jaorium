"use server";

import { createClient } from "@/lib/supabase/server";
import {
  buildAvailabilityRows,
  buildWeeklyApplyPlan,
  groupBandsByDate,
  isMonthString,
  shiftMonth,
} from "@/lib/schedule";

// ---- I/O ----

async function getAuthenticatedUser(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function fetchAvailabilityForMonth(supabase, { mentorId, month }) {
  const { data } = await supabase
    .from("mentor_availabilities")
    .select("date, start_time, end_time")
    .eq("mentor_id", mentorId)
    .gte("date", `${month}-01`)
    // 月末日は月によって変わるので、翌月1日より前で切る（"2026-02-31" はdate型で範囲外になる）
    .lt("date", `${shiftMonth(month, 1)}-01`);
  return data ?? [];
}

async function deleteAvailabilityForDates(supabase, { mentorId, dates }) {
  return supabase
    .from("mentor_availabilities")
    .delete()
    .eq("mentor_id", mentorId)
    .in("date", dates);
}

async function deleteAvailabilityForDate(supabase, { mentorId, date }) {
  return supabase
    .from("mentor_availabilities")
    .delete()
    .eq("mentor_id", mentorId)
    .eq("date", date);
}

async function insertAvailabilityRows(supabase, rows) {
  return supabase.from("mentor_availabilities").insert(rows);
}

// ---- Server Actions ----

// 指定日の面談可能時間を丸ごと入れ替える。
// 帯の重なりはこの「置換 + mergeSlots」で構造的に起きないようにしている。
// 書き込みはRLS（mentor_id = auth.uid()）に従うので、他人の予定は触れない。
export async function saveAvailability(date, slots) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return { error: "ログインが必要です" };

  const { rows, error: validationError } = buildAvailabilityRows({
    mentorId: user.id,
    date,
    slots,
  });
  if (validationError) return { error: validationError };

  const { error: deleteError } = await deleteAvailabilityForDate(supabase, {
    mentorId: user.id,
    date,
  });
  if (deleteError) {
    console.error("saveAvailability delete error:", deleteError);
    return { error: "保存に失敗しました" };
  }

  if (rows.length === 0) return { success: true, bands: [] };

  const { error: insertError } = await insertAvailabilityRows(supabase, rows);
  if (insertError) {
    console.error("saveAvailability insert error:", insertError);
    return { error: "保存に失敗しました" };
  }

  return {
    success: true,
    bands: rows.map(({ start_time, end_time }) => ({ start_time, end_time })),
  };
}

// 曜日ごとの時間帯を、指定月の該当日にまとめて書き込む。
// slotsByWeekday はキーのある曜日だけが対象で、空配列なら「その曜日を空きなしにする」。
// 日数分の往復を避けるため、delete と insert を1回ずつにまとめている。
export async function applyWeeklyAvailability(month, slotsByWeekday, mode = "replace") {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return { error: "ログインが必要です" };
  if (!isMonthString(month)) return { error: "月が不正です" };

  // merge のときは既存の設定と合成する必要があるので、先に月の分を読む
  const existing = await fetchAvailabilityForMonth(supabase, { mentorId: user.id, month });

  const { dates, rows, error: planError } = buildWeeklyApplyPlan({
    mentorId: user.id,
    month,
    slotsByWeekday,
    mode,
    bandsByDate: groupBandsByDate(existing),
  });
  if (planError) return { error: planError };

  if (dates.length === 0) return { success: true, dates: [], bandsByDate: {} };

  const { error: deleteError } = await deleteAvailabilityForDates(supabase, {
    mentorId: user.id,
    dates,
  });
  if (deleteError) {
    console.error("applyWeeklyAvailability delete error:", deleteError);
    return { error: "反映に失敗しました" };
  }

  if (rows.length > 0) {
    const { error: insertError } = await insertAvailabilityRows(supabase, rows);
    if (insertError) {
      console.error("applyWeeklyAvailability insert error:", insertError);
      return { error: "反映に失敗しました" };
    }
  }

  // 反映後の状態をそのまま返し、クライアントは再取得せずに画面を更新する
  return { success: true, dates, bandsByDate: groupBandsByDate(rows) };
}
