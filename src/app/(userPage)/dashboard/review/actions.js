"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import getUrls from "@/utils/getUrls";

function parseReviewForm(formData) {
  return { comments: formData.get("comments"), stars: formData.get("stars") };
}

async function fetchMeetingById(supabase, meetingId) {
  const { data } = await supabase.from("meetings").select("*").eq("id", meetingId).single();
  return data;
}

async function reviewExistsForMeeting(supabase, meetingId) {
  const { data } = await supabase.from("reviews").select("*").eq("meeting_id", meetingId).single();
  return Boolean(data);
}

async function insertReview(supabase, record) {
  return supabase.from("reviews").insert(record).select();
}

async function finishMeetingViaApi(meetingId) {
  const response = await fetch(`${getUrls()}/api/meeting/${meetingId}`, {
    method: "PATCH",
    headers: { "x-api-key": process.env.NEXT_APIROUTE_SECRET },
    body: JSON.stringify({
      action: "finish",
    }),
  });

  if (response.ok) {
    return { ok: true };
  }

  // APIが4xx/5xxを返した場合
  const data = await response.json().catch(() => ({}));
  return { ok: false, error: data.error ?? "エラーが発生しました" };
}

export const submitReview = async (meetingId, prevState, formData) => {
  const { comments, stars } = parseReviewForm(formData);

  if (!comments) return { error: "レビュー内容を入力してください" };
  if (!stars) return { error: "評価を入力してください" };

  const starsNumber = Number(stars);
  if (!Number.isInteger(starsNumber) || starsNumber < 1 || starsNumber > 5) {
    return { error: "評価は1〜5の範囲で選択してください" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const meeting = await fetchMeetingById(supabase, meetingId);

  if (await reviewExistsForMeeting(supabase, meetingId)) {
    return { error: "このミーティングに対するレビューは既に存在します" };
  }

  if (meeting.user !== user.id) {
    return {
      error: "このミーティングに対するレビューを作成する権限がありません",
    };
  }

  const { error } = await insertReview(supabase, {
    meeting_id: meetingId,
    mentor_id: meeting.mentor,
    user_id: meeting.user,
    stars: starsNumber,
    comments,
  });

  const finishResult = await finishMeetingViaApi(meetingId);
  if (!finishResult.ok) {
    return { error: finishResult.error };
  }
  if (error) return { error: "レビューの作成に失敗しました" };

  revalidateTag(`dashboard-user-${meeting.user}`);
  revalidateTag(`dashboard-mentor-${meeting.mentor}`);
  redirect(`/dashboard/`);
};
