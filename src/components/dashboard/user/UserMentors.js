"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, GraduationCap } from "lucide-react";
import Mentor from "../../mentor";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Icon from "../profile/icon";

const REGIONS = [
  "すべて",
  "北海道・東北",
  "関東",
  "中部",
  "関西",
  "中国・四国",
  "九州・沖縄",
];

export default function UserMentors({ mentors }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMentors, setFilteredMentors] = useState(mentors);
  const [selectedRegion, setSelectedRegion] = useState("すべて");
  const [tags, setTags] = useState([]);
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
        const mentor_tags = mentorTagsMap[mentor.id];
        return terms.every((term) => {
          const tag_id = tags.find((tag) => tag.name === term)?.id;

          const matchesSearch =
            mentor.name.toLowerCase().includes(term) ||
            mentor.university.toLowerCase().includes(term);

          const matchesTag = mentor_tags?.some((mt) => mt.tag_id === tag_id);

          return matchesSearch || matchesTag;
        });
      });
      setFilteredMentors(filtered);
    };
    fetchAndFilter();
  }, [searchTerm, selectedRegion, mentors]);

  useEffect(() => {
    const fetchAll = async () => {
      // まずtag_idを取得
      const { data, error } = await supabase.from("tags").select("*");
      if (error) return;
      // console.log(data);
      setTags((prev) => [...prev, ...data]);
    };

    fetchAll();
  }, []);

  return (
    <div className="bg-white">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
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
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        >
          {REGIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      <p className="text-gray-600 mb-4">
        {filteredMentors.length}名のメンターが見つかりました
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMentors.map((mentor) => (
          <div key={mentor.id}>
            <Mentor mentor={mentor} />
          </div>
        ))}
      </div>
    </div>
  );
}
