"use client";

import { Button } from "@/components/ui/button";

import { Search, MapPin, GraduationCap, Star, ArrowRight } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

import { useState, useEffect } from "react";

import Icon from "./profile/icon";

const supabase = createClient();
export default function Mentor({ mentor, toggleTag }) {
  const [tags, setTags] = useState([]);
  useEffect(() => {
    const fetchAll = async () => {
      // まずtag_idを取得
      const { data, error } = await supabase
        .from("mentor_tags")
        .select("tag_id")
        .eq("mentor_id", mentor.id);

      if (error) return;

      const tagIds = data.map((d) => d.tag_id); // stateを使わず直接変数に入れる

      // tagIdsを使ってtagsを取得
      const tagResults = await Promise.all(
        tagIds.map((id) =>
          supabase.from("tags").select("*").eq("id", id).single(),
        ),
      );

      const tagNames = tagResults
        .filter(({ error }) => !error)
        .map(({ data }) => ({ name: data.name, id: data.id }));

      setTags(tagNames);
    };

    fetchAll();
  }, []);
  // console.log(mentor);
  return (
    <>
      <div
        key={mentor.id}
        className="min-w-70 md:min-w-[320px] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 snap-center group flex flex-col"
      >
        <div className="h-40 pt-10 relative">
          <Icon size={120} url={mentor?.icon} />
          <div className="absolute inset-0 via-transparent to-transparent"></div>
          <div className="absolute bottom-3 left-5 text-gray-600">
            <p className="text-[10px] font-bold tracking-widest uppercase mb-0.5 opacity-90">
              {mentor.university}
            </p>
            <p className="text-sm font-bold">{mentor.faculty}</p>
          </div>
        </div>
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold text-slate-800">{mentor.name}</h3>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={10}
                  className="fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
          </div>
          <p className="text-emerald-700 font-bold text-sm mb-3">
            "{mentor.quote}"
          </p>
          <p className="text-slate-500 text-xs leading-relaxed mb-4 grow">
            {mentor.bio}
          </p>

          {tags.length !== 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  onClick={() => toggleTag(tag.id)}
                  className="text-[10px] bg-slate-50 text-slate-500 px-2 py-1 rounded-md font-medium border border-slate-100 cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <Button variant="default" className="bg-blue-500" asChild>
            <Link href={`/dashbord/booking/${mentor.id}`}>相談する</Link>
          </Button>
        </div>
      </div>
    </>
  );
}

