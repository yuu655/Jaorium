"use client";

import { useState, useEffect } from "react";
import Mentor from "@/components/mentor";
import { createClient } from "@/lib/supabase/client";
import { Search, Sparkles, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";

const supabase = createClient();
export default function Mentors({ mentors }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMentors, setFilteredMentors] = useState(mentors);
  // const [selectedRegion, setSelectedRegion] = useState("すべて");
  const [tags, setTags] = useState([]);
  const [diagState, setDiagState] = useState("idle");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [collectedKeywords, setCollectedKeywords] = useState([]);
  // const regions = [
  //   "すべて",
  //   "北海道・東北",
  //   "関東",
  //   "中部",
  //   "関西",
  //   "中国・四国",
  //   "九州・沖縄",
  // ];

  const diagnosisQuestions = [
    {
      title: "興味のある分野は？",
      options: [
        { label: "文系", keyword: "文系" },
        { label: "理系", keyword: "理系" },
        { label: "まだわからない", keyword: "" },
      ],
    },
    {
      title: "大学生活で重視したいことは？",
      options: [
        { label: "部活・サークル活動", keyword: "部活・サークル" },
        { label: "資格取得や専門的な学び", keyword: "資格・就職" },
        { label: "留学・国際交流", keyword: "留学" },
        { label: "特に決まっていない", keyword: "" },
      ],
    },
    {
      title: "気になる受験形式は？",
      options: [
        { label: "一般入試メイン", keyword: "一般入試" },
        { label: "総合型・推薦も視野に", keyword: "学校推薦型選抜" },
        { label: "帰国子女などの特別枠", keyword: "帰国子女" },
        { label: "まずは相談して決めたい", keyword: "" },
      ],
    },
  ];

  const CATEGORY_LABELS = {
    exam: "受験形式",
    uni: "大学・学部",
    sub: "得意教科",
    env: "環境",
    life: "大学生活",
    career: "キャリア",
  };

  const tagGroups = Object.entries(
    tags.reduce((acc, tag) => {
      if (!acc[tag.category]) acc[tag.category] = [];
      acc[tag.category].push(tag);
      return acc;
    }, {}),
  ).map(([category, tags]) => ({
    label: CATEGORY_LABELS[category] ?? category,
    tags,
  }));

  // Mentorsコンポーネント内のstateに追加
  const [selectedTags, setSelectedTags] = useState([]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleAnswer = (keyword) => {
    const newKeywords = keyword
      ? [...collectedKeywords, keyword]
      : collectedKeywords;
    setCollectedKeywords(newKeywords);

    if (currentQIndex < diagnosisQuestions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      // 最後の質問に答えたら分析中へ
      setDiagState("analyzing");
    }
  };

  const resetDiagnosis = () => {
    setDiagState("idle");
    setCurrentQIndex(0);
    setCollectedKeywords([]);
  };

  useEffect(() => {
    if (diagState === "analyzing") {
      const timer = setTimeout(() => {
        setDiagState("result");

        setSelectedTags(
          collectedKeywords
            .map((keyword) => tags.find((tag) => tag.name === keyword)?.id)
            .filter(Boolean),
        );
        // setSelectedTags([...collectedKeywords]);
        // console.log([...collectedKeywords]);
        // console.log(collectedKeywords);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [diagState, collectedKeywords]);

  useEffect(() => {
    const fetchAndFilter = async () => {
      const fetchMentorTags = async (mentorId) => {
        const { data } = await supabase
          .from("mentor_tags")
          .select("tag_id")
          .eq("mentor_id", mentorId);
        // console.log(data);
        return data;
      };
      const mentorTagsMap = Object.fromEntries(
        await Promise.all(
          mentors.map(async (mentor) => [
            mentor.id,
            await fetchMentorTags(mentor.id),
          ]),
        ),
      );
      const terms = searchTerm.split(" ");
      const filtered = mentors.filter((mentor) => {
        // const mentor_tags = mentorTagsMap[mentor.id];
        // return terms.every((term) => {
        //   const tag_id = tags.find((tag) => tag.name === term)?.id;

        // const matchesSearch =
        //   mentor.name.toLowerCase().includes(term) ||
        //   mentor.university.toLowerCase().includes(term);

        //   const matchesTag = mentor_tags?.some((mt) => mt.tag_id === tag_id);

        //   return matchesSearch || matchesTag;
        // });
        const mentorTagNames =
          mentorTagsMap[mentor.id]?.map(
            (mt) => tags.find((t) => t.id === mt.tag_id)?.name,
          ) ?? [];

        const matchesTags = selectedTags.every((tagId) =>
          mentorTagsMap[mentor.id]?.some((mt) => mt.tag_id === tagId),
        );
        const matchesText = terms.every((term) => {
          const matchesSearch =
            mentor.name.toLowerCase().includes(term) ||
            mentor.university.toLowerCase().includes(term) ||
            mentor.faculty.toLowerCase().includes(term);
          return matchesSearch;
        });

        return matchesTags && matchesText;
      });
      setFilteredMentors(filtered);
    };
    fetchAndFilter();

    // console.log(tags);
  }, [searchTerm, selectedTags, mentors]);

  useEffect(() => {
    const fetchAll = async () => {
      // まずtag_idを取得
      const { data, error } = await supabase.from("tags").select("*");
      if (error) return;
      // console.log(data);
      setTags(data);
    };

    fetchAll();
  }, []);

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMentors.map((mentor) => (
              <div key={mentor.id}>
                <Mentor mentor={mentor} toggleTag={toggleTag} />
              </div>
            ))}
          </div>
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
          <Link href="/signup">
            <button className="px-8 py-4 bg-black text-white text-lg font-medium rounded-lg hover:bg-gray-800 transition-colors">
              メンター応募
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
