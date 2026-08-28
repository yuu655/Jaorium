"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setMentorAdminAllow } from "@/app/(userPage)/dashboard/admin/mentors/actions";
import Pagination from "@/components/common/pagination";
import {
  DEFAULT_PAGE_SIZE,
  getTotalPages,
  clampPage,
  paginate,
} from "@/lib/pagination";

export default function AdminMentorList({ mentors, pageSize = DEFAULT_PAGE_SIZE }) {
  const router = useRouter();
  const [pendingOnly, setPendingOnly] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [page, setPage] = useState(1);

  const visibleMentors = pendingOnly
    ? mentors.filter((mentor) => !mentor.adminAllow)
    : mentors;

  // 絞り込みを切り替えたら1ページ目に戻す。
  useEffect(() => {
    setPage(1);
  }, [pendingOnly, mentors]);

  const totalPages = getTotalPages(visibleMentors.length, pageSize);
  const currentPage = clampPage(page, totalPages);
  const pagedMentors = paginate(visibleMentors, currentPage, pageSize);

  const handleToggle = async (mentor) => {
    setBusyId(mentor.id);
    const result = await setMentorAdminAllow(mentor.id, !mentor.adminAllow);
    setBusyId(null);
    if (result?.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">メンター管理</h1>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={(e) => setPendingOnly(e.target.checked)}
            className="w-4 h-4 accent-blue-600"
          />
          未承認（admin_allow = false）のみ表示
        </label>
      </div>

      <p className="text-sm text-gray-500">
        {visibleMentors.length}名該当（全{mentors.length}名）
        {visibleMentors.length > 0 && (
          <>
            {" "}
            / {(currentPage - 1) * pageSize + 1}〜
            {Math.min(currentPage * pageSize, visibleMentors.length)}件目を表示（
            {currentPage} / {totalPages}ページ）
          </>
        )}
      </p>

      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {visibleMentors.length === 0 ? (
          <p className="text-sm text-gray-500 p-6">該当するメンターはいません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left font-medium px-4 py-3">名前</th>
                  <th className="text-left font-medium px-4 py-3">アドレス</th>
                  <th className="text-left font-medium px-4 py-3">admin_allow</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedMentors.map((mentor) => (
                  <tr key={mentor.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{mentor.name}</td>
                    <td className="px-4 py-3 text-gray-600 break-all">{mentor.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          mentor.adminAllow
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {mentor.adminAllow ? "true" : "false"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggle(mentor)}
                        disabled={busyId === mentor.id}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-50 shrink-0 ${
                          mentor.adminAllow
                            ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {busyId === mentor.id
                          ? "更新中..."
                          : mentor.adminAllow
                            ? "falseにする"
                            : "trueにする"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        label="メンター管理一覧のページ送り"
      />
    </div>
  );
}
