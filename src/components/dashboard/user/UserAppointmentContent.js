"use client";

import { Calendar, Plus } from "lucide-react";
import Link from "next/link";
import UserAppointmentTab from "./UserAppointmentTab";
import UserAppointmentUnit from "./UserAppointmentUnit";
import AppointmentUnitPast from "../appointment/appointmentUnitPast";
import Mentors from "./UserMentors";
import { useState } from "react";

export default function UserAppointmentContent({ meetings, mentors }) {
  const [isActive, setIsActive] = useState("upcoming");

  // meeting.mentor (ID) からmentorオブジェクトを引くためのMap
  const mentorMap = Object.fromEntries(mentors.map((m) => [m.id, m]));

  return (
    <>
      <UserAppointmentTab isActive={isActive} setIsActive={setIsActive} />

      <div className="p-6">
        {isActive === "upcoming" && (
          <div className="space-y-4">
            {meetings.next.length > 0 ? (
              meetings.next.map((appointment) => (
                <UserAppointmentUnit
                  key={appointment.id}
                  appointment={appointment}
                  mentor={mentorMap[appointment.mentor]}
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
        )}

        {isActive === "past" && (
          <div className="space-y-4">
            {meetings.past.map((appointment) => (
              <AppointmentUnitPast
                key={appointment.id}
                appointment={appointment}
                counterpart={mentorMap[appointment.mentor]}
              />
            ))}
          </div>
        )}

        {isActive === "mentor" && (
          <div className="space-y-4">
            <Mentors mentors={mentors} />
          </div>
        )}
      </div>
    </>
  );
}
