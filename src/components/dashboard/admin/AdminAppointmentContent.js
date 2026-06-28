"use client";

import { Calendar, Plus } from "lucide-react";
import Link from "next/link";
// import UserAppointmentTab from "./AdminAppointmentTab";
// import UserAppointmentUnit from "./AdminAppointmentUnit";
// import AppointmentUnitPast from "../appointment/appointmentUnitPast";
// import UserAppointmentUnitPast from "./Admin";
import AdminAppointmentUnit from "./AdminAppointmentUnit";
import Mentors from "./AdminMentors";
import MentorSearch from "@/components/common/mentorSearch";
import { useState } from "react";

export default function AdminAppointmentContent({ meetings }) {
  const [isActive, setIsActive] = useState("upcoming");

  // meeting.mentor (ID) からmentorオブジェクトを引くためのMap
  // const mentorMap = Object.fromEntries(mentors.map((m) => [m.id, m]));

  return (
    <>
      {/* <UserAppointmentTab isActive={isActive} setIsActive={setIsActive} /> */}

      <div className="p-6">
        <div className="space-y-4">
            {meetings.length > 0 ? (
              meetings.map((appointment) => (
                <AdminAppointmentUnit
                  key={appointment.id}
                  appointment={appointment}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">予定中の相談はありません</p>
                <div
                  onClick={() => setIsActive("mentor")}
                  className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />新しい相談を予約
                </div>
              </div>
            )}
          </div>
      </div>
    </>
  );
}
