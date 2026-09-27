import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createSlideViewUrl, isSafePathSegment, listSlides } from "@/lib/mentorSlides";
import MentorSlideUploadButton from "@/components/dashboard/admin/MentorSlideUploadButton";

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export default async function AdminMentorSlidesPage({ params, searchParams }) {
  const { mentorId } = await params;
  const { file } = await searchParams;

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

  if (!isSafePathSegment(mentorId)) redirect("/dashboard/admin/mentors");

  const masterSupabase = createAdminSupabaseClient();
  const { data: mentor } = await masterSupabase
    .from("mentors")
    .select("id, name")
    .eq("id", mentorId)
    .maybeSingle();

  if (!mentor) redirect("/dashboard/admin/mentors");

  let slides = [];
  let listError = false;
  try {
    slides = await listSlides(mentorId);
  } catch (e) {
    console.error("listSlides error:", e);
    listError = true;
  }

  // 一覧に実在するファイルだけを表示対象にする（未指定なら最新のもの）
  const selected = slides.find((s) => s.filename === file) ?? slides[0] ?? null;
  const viewUrl = selected ? await createSlideViewUrl(mentorId, selected.filename) : null;

  const basePath = `/dashboard/admin/mentors/${mentorId}/slides`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <div className="space-y-2">
        <Link href="/dashboard/admin/mentors" className="text-sm text-blue-600 hover:underline">
          ← メンター管理に戻る
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold">
            {mentor.name ?? "(名前未設定)"} のスライドPDF
          </h1>
          <MentorSlideUploadButton mentorId={mentorId} />
        </div>
      </div>

      {listError ? (
        <p className="text-sm text-red-600">ファイル一覧の取得に失敗しました。</p>
      ) : slides.length === 0 ? (
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <p className="text-sm text-gray-500">アップロードされたPDFはまだありません。</p>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden self-start">
            <ul className="divide-y divide-gray-100">
              {slides.map((slide) => {
                const active = slide.filename === selected?.filename;
                return (
                  <li key={slide.key}>
                    <Link
                      href={`${basePath}?file=${encodeURIComponent(slide.filename)}`}
                      className={`block px-4 py-3 text-sm ${
                        active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="block font-medium break-all">{slide.filename}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        {formatBytes(slide.size)} ・ {formatDate(slide.lastModified)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-900 break-all">
                {selected.filename}
              </span>
              <a
                href={viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline shrink-0"
              >
                新しいタブで開く
              </a>
            </div>
            <iframe
              key={selected.key}
              src={viewUrl}
              title={selected.filename}
              className="w-full h-[75vh]"
            />
          </section>
        </div>
      )}
    </div>
  );
}
