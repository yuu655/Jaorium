"use client";
import { useState } from "react";
import AppointmentTab from "./appointmentTab";
import AppointmentContent from "./appointmentContent";

export default function Appointment({ isMentor, mentors, meetings }) {
  const [isActive, setIsActive] = useState("upcoming");
  return (
    <>
      <AppointmentTab
        isActive={isActive}
        isMentor={isMentor}
        setIsActive={setIsActive}
      />
      <AppointmentContent
        meetings={meetings}
        isMentor={isMentor}
        isActive={isActive}
        setIsActive={setIsActive}
        mentors={mentors}
      />
    </>
  );
}
