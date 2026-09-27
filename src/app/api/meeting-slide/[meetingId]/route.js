import { createClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchLatestSlideBytes } from "@/lib/mentorSlides";
import { buildMeetingSlide } from "@/lib/meetingSlide/buildMeetingSlide";

// 面談資料（メンターの最新スライドPDF＋質問ページ）をその場で生成して返す。
// 資料を共有できるのはメンターだけなので、取得もその面談のメンターとadminに限る。

const FILENAME = "面談資料.pdf";

async function fetchCallerRole(supabase, userId) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role;
}

async function fetchSlideSource(db, meetingId) {
  const { data: meeting } = await db
    .from("meetings")
    .select("id, mentor, trouble_episode, unresolved_issues")
    .eq("id", meetingId)
    .maybeSingle();
  if (!meeting) return null;

  const { data: advice } = await db
    .from("meeting_advices")
    .select("items")
    .eq("meeting_id", meetingId)
    .maybeSingle();

  return { meeting, adviceItems: advice?.items ?? [] };
}

export async function GET(_req, { params }) {
  const { meetingId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const role = await fetchCallerRole(supabase, user.id);
  if (role !== "mentor" && role !== "admin") {
    return Response.json({ error: "権限がありません" }, { status: 403 });
  }

  // adminは当事者ではないのでRLS外から読む。mentorはRLS配下（当事者の面談しか読めない）
  const db = role === "admin" ? createAdminSupabaseClient() : supabase;
  const source = await fetchSlideSource(db, meetingId);
  if (!source) {
    return Response.json({ error: "面談が見つかりません" }, { status: 404 });
  }

  const { meeting, adviceItems } = source;
  // RLSは当事者なら（user側でも）読めてしまうため、その面談のメンター本人かを明示的に確認する
  if (role === "mentor" && meeting.mentor !== user.id) {
    return Response.json({ error: "権限がありません" }, { status: 403 });
  }

  try {
    let mentorPdfBytes = null;
    try {
      mentorPdfBytes = meeting.mentor ? await fetchLatestSlideBytes(meeting.mentor) : null;
    } catch (e) {
      // R2に届かなくても、質問ページだけの資料は出せるようにする
      console.error("fetchLatestSlideBytes error:", e);
    }

    const pdf = await buildMeetingSlide({
      mentorPdfBytes,
      troubleEpisode: meeting.trouble_episode,
      unresolvedIssues: meeting.unresolved_issues,
      adviceItems,
    });

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(FILENAME)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("buildMeetingSlide error:", e);
    return Response.json({ error: "面談資料の生成に失敗しました" }, { status: 500 });
  }
}
