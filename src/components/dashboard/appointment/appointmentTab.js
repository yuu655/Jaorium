"use client";
import { useState } from "react";
import AppointmentTabUnit from "./appointmentTabUnit";

export default function AppointmentTab({ isActive, setIsActive, isMentor }) {
  return (
    <div className="border-b">
      <div className="flex gap-8 px-6">
        <AppointmentTabUnit
          isActive={isActive}
          setIsActive={setIsActive}
          state="upcoming"
          name="予定中の相談"
        />
        <AppointmentTabUnit
          isActive={isActive}
          setIsActive={setIsActive}
          state="past"
          name="過去の相談"
        />
        {!isMentor && (
          <AppointmentTabUnit
            isActive={isActive}
            setIsActive={setIsActive}
            state="mentor"
            name="予約する"
          />
        )}
      </div>
    </div>
  );
}
