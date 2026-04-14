"use client";

export default function AppointmentTabUnit({ isActive, setIsActive, state, name }) {
  return (
    <button
      onClick={() => setIsActive(state)}
      className={`py-4 font-medium border-b-2 transition-colors ${
        isActive === state
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-600 hover:text-gray-900"
      }`}
    >
      {name}
    </button>
  );
}
