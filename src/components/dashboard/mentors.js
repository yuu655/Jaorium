"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import Mentor from "../mentor";


export default function Mentors({mentors}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("すべて");

  const regions = ["すべて", "北海道・東北", "関東", "中部", "関西", "中国・四国", "九州・沖縄"];

  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch =
      mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.university.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.faculty.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRegion = selectedRegion === "すべて" || mentor.region === selectedRegion;

    return matchesSearch && matchesRegion;
  });

  return (
    <div className="bg-white">

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
    </div>
  );
}