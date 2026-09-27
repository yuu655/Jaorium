import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import Icon from "@/components/dashboard/profile/icon";

const MAX_STARS = 5;

function Stars({ count }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${count} / ${MAX_STARS}`}>
      {Array.from({ length: MAX_STARS }, (_, i) => (
        <Star
          key={i}
          size={18}
          className={i < count ? "fill-amber-400 text-amber-400" : "text-gray-300"}
        />
      ))}
      <span className="ml-1.5 text-sm font-medium text-gray-700">{count}</span>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export default async function AdminReviewPage({ params }) {
  const { meetingId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // middlewareは /dashboard/admin（完全一致）しかガードしないため、
  // サブパスであるこのページでも必ずロールを確認する
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const masterSupabase = createAdminSupabaseClient();

  const { data: meeting } = await masterSupabase
    .from("meetings")
    .select("id, title, user, mentor")
    .eq("id", meetingId)
    .maybeSingle();

  if (!meeting) redirect("/dashboard/admin");

  // 書き込み側（dashboard/review）は1相談1件を前提にしているがDB上の一意制約は
  // ないため、maybeSingle()ではなく一覧で取得して全件表示する
  const [{ data: meetingUser }, { data: mentor }, { data: reviews, error: reviewsError }] =
    await Promise.all([
      masterSupabase.from("users").select("name, icon").eq("id", meeting.user).maybeSingle(),
      masterSupabase.from("mentors").select("name, icon").eq("id", meeting.mentor).maybeSingle(),
      masterSupabase
        .from("reviews")
        .select("id, stars, comments, created_at")
        .eq("meeting_id", meetingId)
        .order("created_at", { ascending: true }),
    ]);

  if (reviewsError) {
    console.error("admin review fetch error:", reviewsError.message);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <Link
        href="/dashboard/admin"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
      >
        <ArrowLeft size={16} />
        管理画面に戻る
      </Link>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
        <h1 className="text-2xl font-bold">レビュー確認</h1>
        <p className="text-sm text-gray-600">
          相談内容：<span className="font-medium text-gray-900">{meeting.title}</span>
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Icon size={48} url={mentor?.icon} />
            <div>
              <p className="text-xs text-gray-500">メンター</p>
              <p className="font-medium">{mentor?.name ?? "(不明)"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Icon size={48} url={meetingUser?.icon} />
            <div>
              <p className="text-xs text-gray-500">ユーザー（レビュー投稿者）</p>
              <p className="font-medium">{meetingUser?.name ?? "(不明)"}</p>
            </div>
          </div>
        </div>
      </div>

      {reviewsError ? (
        <p className="text-sm text-red-600">レビューの取得に失敗しました。</p>
      ) : !reviews || reviews.length === 0 ? (
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <p className="text-sm text-gray-500">この相談のレビューはまだ投稿されていません。</p>
        </section>
      ) : (
        reviews.map((review) => (
          <section
            key={review.id}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-3"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Stars count={review.stars} />
              <span className="text-xs text-gray-500">{formatDate(review.created_at)}</span>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
              {review.comments || "（コメントなし）"}
            </p>
          </section>
        ))
      )}
    </div>
  );
}
