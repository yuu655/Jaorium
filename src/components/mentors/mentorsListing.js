"use client";

import { useState } from "react";
import MentorCard from "@/components/mentors/MentorCard";
import Pagination from "@/components/common/pagination";
import MentorFilterSheet from "@/components/mentors/MentorFilterSheet";
import {
  Search,
  Sparkles,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";

export default function Mentors({ diagState, setDiagState, currentQIndex, diagnosisQuestions, handleAnswer, resetDiagnosis, tagGroups, toggleTag, clearTags, clearFilters, filteredMentors, pagedMentors, page, totalPages, pageSize, goToPage, selectedTags, searchTerm, setSearchTerm, mentorTagsMap, tags }) {
  const tagById = Object.fromEntries((tags ?? []).map((t) => [t.id, t]));
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handlePageChange = (nextPage) => {
    goToPage(nextPage);
    document
      .getElementById("mentor-list")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="py-16 md:py-24 bg-linear-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
            メンター紹介
          </h1>
          <p className="text-xl text-center text-gray-600 max-w-3xl mx-auto">
            あなたの先輩が、本音で向き合います。
            <br />
            全員が受験を乗り越え、JaoRiumの理念に共感したメンバーです。
          </p>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden my-12 relative max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 背景の装飾 */}
        <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-blue-400 to-blue-600"></div>

        <div className="p-8 md:p-12 min-h-80 flex flex-col items-center justify-center">
          {/* 状態1: 初期画面 */}
          {diagState === "idle" && (
            <div className="text-center animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                まずは、<span className="text-blue-600">簡単診断</span>から。
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                たった3問答えるだけ。あなたの興味や状況にぴったりのメンターを提案します。
              </p>
              <button
                onClick={() => setDiagState("questioning")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
              >
                30秒でマッチングをスタート
              </button>
            </div>
          )}

          {/* 状態2: 質問画面 */}
          {diagState === "questioning" && (
            <div className="text-center w-full max-w-2xl animate-in slide-in-from-right-8 fade-in duration-300">
              <p className="text-blue-600 font-bold mb-2">
                Q{currentQIndex + 1} / {diagnosisQuestions.length}
              </p>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-8">
                {diagnosisQuestions[currentQIndex].title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diagnosisQuestions[currentQIndex].options.map(
                  (option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option.keyword)}
                      className="bg-white border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50 text-gray-700 font-medium py-4 px-6 rounded-2xl transition-all duration-200 shadow-sm"
                    >
                      {option.label}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {/* 状態3: 分析中（ローディング） */}
          {diagState === "analyzing" && (
            <div className="text-center animate-in fade-in duration-300">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-800 tracking-widest animate-pulse">
                ANALYZING...
              </h3>
              <p className="text-gray-500 mt-2 text-sm">
                あなたに合うメンターを探しています
              </p>
            </div>
          )}

          {/* 状態4: 結果表示 */}
          {diagState === "result" && (
            <div className="text-center animate-in zoom-in fade-in duration-500">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                マッチング完了！
              </h2>
              <p className="text-gray-600 mb-6">
                あなたの回答に基づき、おすすめのメンターを絞り込みました。
                <br />
                {/* <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                    抽出キーワード: {searchQuery || '指定なし'}
                  </span> */}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    document
                      .getElementById("mentor-list")
                      .scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-full shadow-md transition-all duration-200"
                >
                  メンターを見る
                </button>
                <button
                  onClick={resetDiagnosis}
                  className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium py-2.5 px-6 rounded-full transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  やり直す
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 検索 + 絞り込み。ヘッダー(h-21.5)の直下に追従させる。 */}
      <section className="sticky top-21.5 z-30 border-b border-[#E4E7EB] bg-white/94 py-3.5 shadow-[0_2px_10px_rgba(31,35,40,.05)] backdrop-blur-md lg:py-4.5">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-4.5">
            <div className="flex items-center gap-2.5 lg:flex-1 lg:gap-4.5">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#98A0AA]"
                  size={17}
                />
                <input
                  type="text"
                  placeholder="名前、大学、学部、タグで検索（スペースでAND検索）"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-[10px] border border-[#D5D9DF] py-3.5 pr-10 pl-11 text-[13.5px] text-[#1F2328] placeholder:text-[#98A0AA] focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/12 focus:outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="検索キーワードをクリア"
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-[#98A0AA] transition-colors hover:text-[#1F2328]"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className="flex flex-none items-center gap-2 rounded-[10px] border-1.5 border-[#1F2328] px-4 py-3.25 text-[13px] font-bold whitespace-nowrap text-[#1F2328] transition-colors hover:bg-[#1F2328] hover:text-white lg:gap-2.25 lg:px-6 lg:text-sm"
              >
                <SlidersHorizontal size={17} />
                絞り込み
                {selectedTags.length > 0 && (
                  <span className="rounded-full bg-[#2563EB] px-2 py-0.75 text-[11px] leading-none font-bold text-white">
                    {selectedTags.length}
                  </span>
                )}
              </button>
            </div>

            <p className="text-[13px] whitespace-nowrap text-[#4B5563]">
              <span className="text-xl font-bold text-[#1F2328]">
                {filteredMentors.length}
              </span>
              {" 名のメンター"}
            </p>
          </div>

          {/* 選択中のタグ。ここから個別に外せる。 */}
          {selectedTags.length > 0 && (
            <div className="mt-2.5 flex items-center gap-1.75 overflow-x-auto pb-0.5 lg:mt-3 lg:flex-wrap lg:overflow-x-visible">
              {selectedTags.map((tagId) => (
                <button
                  key={tagId}
                  type="button"
                  onClick={() => toggleTag(tagId)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#2563EB] bg-[#2563EB] px-3.5 py-2 text-xs leading-none font-bold whitespace-nowrap text-white transition-colors hover:bg-[#1D4ED8]"
                >
                  {tagById[tagId]?.name ?? "タグ"}
                  <X size={13} strokeWidth={2.5} />
                </button>
              ))}
              <button
                type="button"
                onClick={clearTags}
                className="shrink-0 px-1 text-xs font-medium text-[#2F5FD0] hover:underline"
              >
                解除
              </button>
            </div>
          )}
        </div>
      </section>

      <MentorFilterSheet
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        tagGroups={tagGroups}
        selectedTags={selectedTags}
        toggleTag={toggleTag}
        clearTags={clearTags}
        resultCount={filteredMentors.length}
      />


      {/* Mentors Grid */}
      <section id="mentor-list" className="bg-[#F9FAFC] py-10 lg:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredMentors.length > 0 && (
            <p className="mb-6 text-sm text-[#98A0AA]">
              {(page - 1) * pageSize + 1}〜
              {Math.min(page * pageSize, filteredMentors.length)}件目を表示 （
              {page} / {totalPages}ページ）
            </p>
          )}

          {filteredMentors.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-600 mb-4">
                条件に合うメンターが見つかりませんでした。
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-full shadow-md transition-all duration-200"
              >
                検索条件をクリア
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pagedMentors.map((mentor) => (
                  <div key={mentor.id}>
                    <MentorCard
                      mentor={mentor}
                      reviewSum={mentor.review_sum}
                      tagNames={(mentorTagsMap?.[mentor.id] ?? [])
                        .map(({ tag_id }) => tagById[tag_id])
                        .filter(Boolean)}
                      onTagClick={toggleTag}
                    />
                  </div>
                ))}
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                label="メンター一覧のページ送り"
              />
            </>
          )}
        </div>
      </section>

      {/* Become a Mentor CTA */}
      <section className="py-20 bg-linear-to-r from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            あなたの経験が、 誰かの道しるべになる。
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            JaoRiumでは、共に未来を作る大学生メンターを募集しています。
            <br />
            過去の苦労や成功体験を、次の世代へつなぎませんか？
          </p>
          <Link href="/signup/mentor">
            <button className="px-8 py-4 bg-black text-white text-lg font-medium rounded-lg hover:bg-gray-800 transition-colors">
              メンター応募
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
