import Booking from "@/components/dashboard/booking";
import { submitBooking } from "./actions";

export default async function BookingPage({ params }) {
  const { id } = await params;

  // idをbindしてServer Actionに埋め込む
  const submitBookingWithId = submitBooking.bind(null, id);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-center font-bold text-3xl py-20">予約フォーム</h1>
        <Booking func={submitBookingWithId} />
      </div>
    </div>
  );
}