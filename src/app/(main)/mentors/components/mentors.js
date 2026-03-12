"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import Mentor from "@/components/mentor";


export default function Mentors({mentors}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("すべて");

  const regions = ["すべて", "北海道・東北", "関東", "中部", "関西", "中国・四国", "九州・沖縄"];

  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch =
      mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.university.toLowerCase().includes(searchTerm.toLowerCase());
      // mentor.specialties.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRegion = selectedRegion === "すべて" || mentor.region[0] === selectedRegion;

    return matchesSearch && matchesRegion;
  });

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="py-16 md:py-24 bg-linear-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
            メンター紹介
          </h1>
          <p className="text-xl text-center text-gray-600 max-w-3xl mx-auto">
            あなたの先輩が、本音で向き合います。<br />
            全員が受験を乗り越え、JaoRiumの理念に共感したメンバーです。
          </p>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="名前、大学、専門分野で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Region Filter */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Mentors Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-gray-600">
              {filteredMentors.length}名のメンターが見つかりました
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMentors.map((mentor) => (
              <div key={mentor.id}><Mentor mentor={mentor}/></div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Mentor CTA */}
      <section className="py-20 bg-linear-to-r from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            あなたの経験が、
誰かの道しるべになる。
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            JaoRiumでは、共に未来を作る大学生メンターを募集しています。<br/>
        過去の苦労や成功体験を、次の世代へつなぎませんか？
          </p>
          <button className="px-8 py-4 bg-black text-white text-lg font-medium rounded-lg hover:bg-gray-800 transition-colors">
            メンター応募について詳しく見る
          </button>
        </div>
      </section>
    </div>
  );
}