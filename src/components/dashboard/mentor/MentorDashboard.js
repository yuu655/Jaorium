"use client";

import { useState } from "react";
import MentorSidebar from "./MentorSidebar";
import MentorAppointmentContent from "./MentorAppointmentContent";
import MentorTemplateContent from "./MentorTemplateContent";
import { updateMentorIcon, updateMentorProfile } from "../profile/actions";
import MentorProfile from "./MentorProfile";
import StatusCode from "../common/statusCode";

export default function MentorDashboard({ profile, meetings, users, mentorTags, allTags, initialSide }) {
  const [side, setSide] = useState(initialSide || "appointment");

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <MentorSidebar profile={profile} side={side} setSide={setSide}/>

          <main className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <StatusCode meetings={meetings} />
            </div>

            <div className="bg-white rounded-lg shadow-sm">
              {side === "appointment" && (
                <MentorAppointmentContent meetings={meetings} users={users} />
              )}
              {side === "profile" && (
                <MentorProfile funcProfile={updateMentorProfile} funcIcon={updateMentorIcon} profile={profile} mentorTags={mentorTags} allTags={allTags} />
              )}
              {side === "template" && (
                <MentorTemplateContent />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
