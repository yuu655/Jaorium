import MentorSidebar from "./MentorSidebar";
import StatusCode from "../common/statusCode";

// メンターダッシュボードの外枠（サイドバー＋件数サマリ＋本文カード）。
// /dashboard/mentor（タブ切替あり・クライアント）と
// /dashboard/mentor/availability（独立ルート・サーバー）の両方から使う。
// setSide を渡さない場合、サイドバーは全項目をリンクとして描画する。
export default function MentorDashboardShell({
  profile,
  meetings,
  side,
  setSide,
  children,
}) {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <MentorSidebar profile={profile} side={side} setSide={setSide} />

          <main className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <StatusCode meetings={meetings} />
            </div>

            <div className="bg-white rounded-lg shadow-sm">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
