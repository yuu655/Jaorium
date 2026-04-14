"use client";
import { useEffect, useState } from "react";
import { Calendar, Plus } from "lucide-react";
import Link from "next/link";
import AppointmentUnit from "./appointmentUnit";
import AppointmentUnitPast from "./appointmentUnitPast";
import Mentors from "../mentors";
import { createClient } from "@/lib/supabase/client";

export default function AppointmentContent({ isActive, mentors, isMentor, meetings }) {
  return (
    <div className="p-6">
      {isActive === "upcoming" && (
        <div className="space-y-4">
          {meetings.next.length > 0 ? (
            meetings.next.map((appointment) => (
              <AppointmentUnit key={appointment.id} appointment={appointment} mentors={mentors} isMentor={isMentor} />
            ))
          ) : (
            <div className="text-center py-12">
              <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">予定中の相談はありません</p>
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                新しい相談を予約
              </Link>
            </div>
          )}
        </div>
      )}

      {isActive === "past" && (
        <div className="space-y-4">
          {meetings.past.map((appointment) => (
            <AppointmentUnitPast key={appointment.id} appointment={appointment} mentors={mentors} isMentor={isMentor} />
          ))}
        </div>
      )}

      {(!isMentor && isActive === "mentor") && (
        <div className="space-y-4">
          <Mentors mentors={mentors}/>
        </div>
      )}
    </div>
  );
}
