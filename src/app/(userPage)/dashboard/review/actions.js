"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const submitReview = async (meetingId, prevState, formData) => {
  const comments = formData.get("comments");
  const stars = formData.get("stars");

  if (!comments) return { error: "レビュー内容を入力してください" };
  if (!stars) return { error: "評価を入力してください" };

  const supabase = await createClient();
  const masterSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_SECRET_KEY,
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { data: meeting } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .single();
  console.log(meeting);

  const {data: review_exist} = await supabase
    .from("reviews")
    .select("*")
    .eq("meeting_id", meetingId)
    .single();

  if (review_exist) {
    return { error: "このミーティングに対するレビューは既に存在します" };
  }

  if(meeting.user !== user.id) {
    return { error: "このミーティングに対するレビューを作成する権限がありません" };
  }

  const { data: reviewData, error } = await supabase
    .from("reviews")
    .insert({
      meeting_id: meetingId,
      mentor_id: meeting.mentor,
      user_id: meeting.user,
      stars,
      comments,
    })
    .select();

  console.log(error);
  if (error) return { error: "レビューの作成に失敗しました" };

  redirect(`/dashboard/`);
};
