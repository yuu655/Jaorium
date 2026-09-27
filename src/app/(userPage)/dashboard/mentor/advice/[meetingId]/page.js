import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import MeetingAdviceForm from "@/components/dashboard/mentor/MeetingAdviceForm";

function Answer({ label, value }) {
  return (
    <div>
      <p className="text-sm font-bold text-gray-900 mb-1">{label}</p>
      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words bg-gray-50 border border-gray-200 rounded-lg p-3">
        {value?.trim() || "（回答なし）"}
      </p>
    </div>
  );
}

// 面談資料の質問ページに載せる「メンターからのアドバイス」を面談前に入力する。
// /dashboard/mentor 配下なので middleware の mentor ゲートが効くが、
// 他のメンターの面談を開けないよう、ここでも面談のメンター本人かを確認する。
export default async function MentorAdvicePage({ params, searchParams }) {
  const { meetingId } = await params;
  const { required } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, mentor, user, title, trouble_episode, unresolved_issues, actions_taken, desired_outcome")
    .eq("id", meetingId)
    .maybeSingle();

  if (!meeting || meeting.mentor !== user.id) redirect("/dashboard/mentor");

  const [{ data: advice }, { data: schedule }, { data: meetingUser }] = await Promise.all([
    supabase.from("meeting_advices").select("items").eq("meeting_id", meetingId).maybeSingle(),
    supabase.from("meeting_schedules").select("is_finished").eq("meeting_id", meetingId).maybeSingle(),
    meeting.user
      ? supabase.from("users").select("name").eq("id", meeting.user).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const isFinished = Boolean(schedule?.is_finished);
  const hasAdvice = (advice?.items?.length ?? 0) > 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            href="/dashboard/mentor"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft size={16} />
            予約管理に戻る
          </Link>
          {/* 未入力のうちはチャットへ行っても入力ページに戻されるので出さない */}
          {(hasAdvice || isFinished) && (
            <Link
              href={`/dashboard/chat/${meetingId}`}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <MessageSquare size={16} />
              チャットに戻る
            </Link>
          )}
        </div>

        {required && !hasAdvice && !isFinished && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            チャットを開く前に、面談資料に載せる「メンターからのアドバイス」を入力してください。保存するとチャットに進みます。
          </p>
        )}

        <div>
          <h1 className="text-2xl font-bold">面談資料のアドバイス入力</h1>
          <p className="text-sm text-gray-600 mt-1">
            {meetingUser?.name ?? "相談者"}さん ／ {meeting.title}
          </p>
        </div>

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-red-600">アンケートで教えてくれたこと</h2>
          <Answer label="Q. 最近一番困ったエピソード" value={meeting.trouble_episode} />
          <Answer label="Q. 取った行動" value={meeting.actions_taken} />
          <Answer label="Q. 望んでいた結果" value={meeting.desired_outcome} />
          <Answer label="Q. 行動しても解決しなかったこと" value={meeting.unresolved_issues} />
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div>
            <h2 className="font-bold text-blue-700">メンターからのアドバイス</h2>
            <p className="text-xs text-gray-500 mt-1">
              面談資料の最後のページに表示されます（最大3項目）。詳細は面談中に口頭で補足してください。
            </p>
          </div>
          {isFinished && (
            <p className="text-sm text-gray-600 bg-gray-100 rounded-lg px-3 py-2">
              この面談は終了しているため編集できません。
            </p>
          )}
          <MeetingAdviceForm
            meetingId={meetingId}
            initialItems={advice?.items ?? []}
            disabled={isFinished}
          />
        </section>
      </div>
    </div>
  );
}
