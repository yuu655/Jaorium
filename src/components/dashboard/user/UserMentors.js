"use client";

import { Search, Sparkles, Loader2, RefreshCw } from "lucide-react";
import Mentor from "../mentor";

export default function UserMentors({ diagState, setDiagState, currentQIndex, diagnosisQuestions, resetDiagnosis, tagGroups, toggleTag, filteredMentors, selectedTags, searchTerm, setSearchTerm, handleAnswer }) {
  return (
    <div className="bg-white">
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

      {/* Search and Filter */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="名前、大学、専門分野で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Region Filter */}
            {/* <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select> */}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {tagGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="text-xs text-gray-400 mb-2">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    selectedTags.includes(tag.id)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-blue-400"
                  }`}
                >
                  {tag.name}
                </button>
                //               <button
                //   key={tag.id}
                //   onClick={() => toggleTag(tag.id)}
                //   className={`... ${selectedTags.includes(tag.id) ? "bg-blue-600 ..." : "..."}`}
                // >
                //   {tag.name}
                // </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Mentors Grid */}
      <section id="mentor-list" className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-gray-600">
              {filteredMentors.length}名のメンターが見つかりました
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {filteredMentors.map((mentor) => (
              <div key={mentor.id}>
                <Mentor mentor={mentor} toggleTag={toggleTag} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
