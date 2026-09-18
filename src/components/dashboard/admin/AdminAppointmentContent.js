"use client";

import { Calendar } from "lucide-react";
import { useMemo, useState } from "react";
import AdminAppointmentTab from "./AdminAppointmentTab";
import AdminAppointmentUnit from "./AdminAppointmentUnit";
import AdminAppointmentUnitPast from "./AdminAppointmentUnitPast";
import Pagination from "@/components/common/pagination";
import { clampPage, getTotalPages, paginate } from "@/lib/pagination";

// adminの相談一覧は20件ずつ（メンター一覧の30件とは別運用）
export const ADMIN_MEETINGS_PAGE_SIZE = 20;

export default function AdminAppointmentContent({
  meetings = [],
  pastMeetings = [],
  pageSize = ADMIN_MEETINGS_PAGE_SIZE,
}) {
  const [isActive, setIsActive] = useState("upcoming");
  // ページ番号はタブごとに覚えておく（タブを往復しても戻らない）
  const [pages, setPages] = useState({ upcoming: 1, past: 1 });

  const isPast = isActive === "past";
  const items = isPast ? pastMeetings : meetings;

  const totalPages = getTotalPages(items.length, pageSize);
  const currentPage = clampPage(pages[isActive], totalPages);
  const paged = useMemo(
    () => paginate(items, currentPage, pageSize),
    [items, currentPage, pageSize],
  );

  const setPage = (page) => setPages((prev) => ({ ...prev, [isActive]: page }));

  return (
    <>
      <AdminAppointmentTab isActive={isActive} setIsActive={setIsActive} />

      <div className="p-6">
        {items.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-4">
              全{items.length}件 / {(currentPage - 1) * pageSize + 1}〜
              {Math.min(currentPage * pageSize, items.length)}件目を表示（
              {currentPage} / {totalPages}ページ）
            </p>

            <div className="space-y-4">
              {paged.map((appointment) =>
                isPast ? (
                  <AdminAppointmentUnitPast
                    key={appointment.id}
                    appointment={appointment}
                  />
                ) : (
                  <AdminAppointmentUnit
                    key={appointment.id}
                    appointment={appointment}
                  />
                ),
              )}
            </div>

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              label={isPast ? "終了済みの相談のページ送り" : "予定中の相談のページ送り"}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {isPast ? "終了済みの相談はありません" : "予定中の相談はありません"}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
