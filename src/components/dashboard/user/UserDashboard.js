"use client";

import { useState } from "react";
import UserSidebar from "./UserSidebar";
import UserAppointmentContent from "./UserAppointmentContent";
import UserProfile from "./UserProfile";
import StatusCode from "../common/statusCode";

import { updateUserIcon, updateUserProfile } from "../profile/actions";

export default function UserDashboard({ profile, meetings, mentors }) {
  const [side, setSide] = useState("appointment");

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <UserSidebar profile={profile} side={side} setSide={setSide} />

          <main className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <StatusCode meetings={meetings} />
            </div>

            <div className="bg-white rounded-lg shadow-sm">
              {side === "appointment" && (
                <UserAppointmentContent meetings={meetings} mentors={mentors} />
              )}
              {side === "profile" && (
                <UserProfile funcProfile={updateUserProfile} funcIcon={updateUserIcon} profile={profile} />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
