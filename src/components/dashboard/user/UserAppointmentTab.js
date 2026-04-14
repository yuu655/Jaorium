import AppointmentTabUnit from "../appointment/appointmentTabUnit";

// userは「予約する」タブがある
export default function UserAppointmentTab({ isActive, setIsActive }) {
  return (
    <div className="border-b">
      <div className="flex gap-8 px-6">
        <AppointmentTabUnit isActive={isActive} setIsActive={setIsActive} state="upcoming" name="予定中の相談" />
        <AppointmentTabUnit isActive={isActive} setIsActive={setIsActive} state="past" name="過去の相談" />
        <AppointmentTabUnit isActive={isActive} setIsActive={setIsActive} state="mentor" name="予約する" />
      </div>
    </div>
  );
}
