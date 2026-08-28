"use client";

import { useState, useEffect, useMemo, cloneElement, Children } from "react";
import { filterMentors } from "@/lib/mentorFilter";
import { DEFAULT_PAGE_SIZE, getTotalPages, clampPage } from "@/lib/pagination";

export default function MentorSearch({
  mentors,
  mentorTagsMap,
  tags,
  pageSize = DEFAULT_PAGE_SIZE,
  children,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  // const [selectedRegion, setSelectedRegion] = useState("すべて");
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
    life: "大学生活",
    career: "キャリア",
    env: "環境",
    sub: "得意教科",
  };

  const tagGroups = Object.entries(
    (tags ?? []).reduce((acc, tag) => {
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

  // タグだけ解除(キーワードは残す)。絞り込みパネルの「すべて解除」用。
  const clearTags = () => setSelectedTags([]);

  const clearFilters = () => {
    setSelectedTags([]);
    setSearchTerm("");
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

  const filteredMentors = useMemo(
    () =>
      filterMentors({
        mentors,
        mentorTagsMap,
        tags,
        searchTerm,
        selectedTags,
      }),
    [mentors, mentorTagsMap, tags, searchTerm, selectedTags],
  );

  // ページネーション。検索条件が変わったら1ページ目に戻す。
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedTags, mentors]);

  const totalPages = getTotalPages(filteredMentors.length, pageSize);
  // 絞り込みで件数が減った直後など、範囲外のページ番号は表示側で丸めておく。
  const currentPage = clampPage(page, totalPages);
  const pagedMentors = useMemo(
    () => filteredMentors.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredMentors, currentPage, pageSize],
  );

  const goToPage = (nextPage) => setPage(clampPage(nextPage, totalPages));

  return (
    <>
      {Children.map(children, (child) =>
        cloneElement(child, {
          diagState,
          setDiagState,
          currentQIndex,
          diagnosisQuestions,
          resetDiagnosis,
          tagGroups,
          toggleTag,
          clearTags,
          clearFilters,
          filteredMentors,
          pagedMentors,
          page: currentPage,
          totalPages,
          pageSize,
          goToPage,
          selectedTags,
          searchTerm,
          setSearchTerm,
          handleAnswer,
          mentorTagsMap,
          tags,
        }),
      )}
    </>
  );
}
