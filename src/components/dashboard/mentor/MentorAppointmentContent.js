"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import MentorAppointmentTab from "./MentorAppointmentTab";
import MentorAppointmentUnit from "./MentorAppointmentUnit";
import AppointmentUnitPast from "../appointment/appointmentUnitPast";

export default function MentorAppointmentContent({ meetings, users }) {
  const [isActive, setIsActive] = useState("upcoming");

  // meeting.user (ID) からuserオブジェクトを引くためのMap
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return (
    <>
      <MentorAppointmentTab isActive={isActive} setIsActive={setIsActive} />

      <div className="p-6">
        {isActive === "upcoming" && (
          <div className="space-y-4">
            {meetings.next.length > 0 ? (
              meetings.next.map((appointment) => (
                <MentorAppointmentUnit
                  key={appointment.id}
                  appointment={appointment}
                  user={userMap[appointment.user]}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">予定中の相談はありません</p>
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
                counterpart={userMap[appointment.user]}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
