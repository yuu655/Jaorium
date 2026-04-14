"use client";

import Sidebar from "./sidebar";
import StatusCode from "./common/statusCode";
import Appointment from "./appointment/appointment";
import Profile from "./profile/profile";

import { useState } from "react";

export default function DashbordComponent({
  profile,
  meetings,
  isMentor,
  mentors,
}) {
  const [side, setSide] = useState("appointment");
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <Sidebar
            profile={profile}
            meetings={meetings}
            isMentor={isMentor}
            setSide={setSide}
            side={side}
          />

          <main className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatusCode
                profile={profile}
                meetings={meetings}
                isMentor={isMentor}
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm">
              {side === "appointment" && (
                <Appointment
                  profile={profile}
                  meetings={meetings}
                  isMentor={isMentor}
                  mentors={mentors}
                  side={side}
                />
              )}
              {side === "profile" && (
                <Profile
                  profile={profile}
                  isMentor={isMentor}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
