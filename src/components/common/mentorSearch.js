"use client";

import { useState, useEffect, cloneElement, Children } from "react";
import Mentor from "@/components/mentor";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

export default function MentorSearch({
  mentors,
  mentorTagsMap,
  tags,
  children,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMentors, setFilteredMentors] = useState(mentors);
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
    const terms = searchTerm.split(" ");
    const filtered = mentors.filter((mentor) => {
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

    // console.log(tags);
  }, [searchTerm, selectedTags, mentors]);

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
          filteredMentors,
          selectedTags,
          searchTerm,
          setSearchTerm,
        }),
      )}
    </>
  );
}
