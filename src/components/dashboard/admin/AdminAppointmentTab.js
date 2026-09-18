import AppointmentTabUnit from "../appointment/appointmentTabUnit";

// adminは予約する側ではないので「予定中」「終了済み」だけ
export default function AdminAppointmentTab({ isActive, setIsActive }) {
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
          name="終了済みの相談"
        />
      </div>
    </div>
  );
}
