import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/dashboard/admin/AdminDashboard";

export default async function UserPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if(profile.role !== "admin"){
    redirect("/dashboard")
  }
  const masterSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_SECRET_KEY,
  );

  const { data: MeetingConfirmations } = await masterSupabase
    .from("meeting_confirmations")
    .select("*")
    .not("meeting_id", "is", null);;

  const { data: Meetings } = await masterSupabase
    .from("meetings")
    .select("*")
    .in(
      "id",
      MeetingConfirmations.map((item) => item.meeting_id),
    )
    .order("created_at", { ascending: false });

  const { data: meeting_sc } = await masterSupabase
    .from("meeting_schedules")
    .select("*")
    .in(
      "meeting_id",
      Meetings.map((item) => item?.id),
    );

  const normalized_meeting_sc = meeting_sc.map((item) => ({
    id: item?.meeting_id,
    ...item,
  }));

  const map = new Map();

  Meetings.forEach((item) => {
    map.set(item.id, { ...item });
  });

  normalized_meeting_sc.forEach((item) => {
    if (map.has(item.id)) {
      Object.assign(map.get(item.id), item);
    } else {
      map.set(item.id, { ...item });
    }
  });

  // 結果を配列に戻す
  const merged_meetings = Array.from(map.values());

  for (let i = 0; i < merged_meetings.length; i++) {
    const {data:user} = await masterSupabase
      .from("users")
      .select("*")
      .eq("id", merged_meetings[i].user)
      .single();
    const {data:mentor} = await masterSupabase
      .from("mentors")
      .select("*")
      .eq("id", merged_meetings[i].mentor)
      .single();
    merged_meetings[i].user = user;
    merged_meetings[i].mentor = mentor;
  }
  // const doubledNumbers = merged_meetings.map(meeting => {
  //   const user = await masterSupabase.from("users").select("*").eq("id", meeting.user).single()
  // });

  const nextMeetings = merged_meetings.filter((item) => !item.is_finished);
  const pastMeetings = merged_meetings.filter((item) => item.is_finished);

  // console.log(merged_meetings);

  return (
    <AdminDashboard meetings={merged_meetings}/>
  );
}
