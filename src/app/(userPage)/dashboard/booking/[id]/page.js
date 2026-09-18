import Booking from "@/components/dashboard/booking";
import { submitBooking } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { groupBandsByDate, hasFutureAvailability, todayInJst } from "@/lib/schedule";
import { fetchMentorAvailability, fetchMentorBookedByDate } from "@/lib/mentorSchedule";

export default async function BookingPage({ params }) {
  const { id } = await params;

  // idをbindしてServer Actionに埋め込む
  const submitBookingWithId = submitBooking.bind(null, id);

  const supabase = await createClient();
  const today = todayInJst();

  // メンターの面談可能日時。予約フォームの希望日時はこの範囲からしか選べない。
  const availability = await fetchMentorAvailability(supabase, { mentorId: id, from: today });

  // このメンターが別の面談で確定済みの日時。他人の面談のscheduleはRLSで読めないため
  // service role で引き、開始時刻だけをクライアントに渡す（面談IDや相手の情報は渡さない）。
  const bookedByDate = await fetchMentorBookedByDate(createAdminSupabaseClient(), {
    mentorId: id,
    from: today,
  });

  // メンターが今後の空きを1つも登録していなければ、これまで通り自由に選べる
  const unrestricted = !hasFutureAvailability(availability);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-center font-bold text-3xl py-20">予約フォーム</h1>
        <Booking
          func={submitBookingWithId}
          availabilityByDate={groupBandsByDate(availability)}
          bookedByDate={bookedByDate}
          unrestricted={unrestricted}
        />
      </div>
    </div>
  );
}
