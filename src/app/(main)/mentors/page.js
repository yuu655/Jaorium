import Mentor from "./components/mentors";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const getMentors = (supabase) =>
  unstable_cache(
    async () => {
      const [{ data: mentors }, { data: mentor_admin_allow }] = await Promise.all([
        supabase.from("mentors").select("*").eq("is_allowed", true),
        supabase.from("mentor_secret").select("*").eq("admin_allow", true),
      ])
      // const { data: mentors } = await supabase
      //   .from("mentors")
      //   .select("*")
      //   .limit(3);
      const mentor_admin_allow_list = mentor_admin_allow.map(item => item.id);
      const public_admin_allowed_mentor = mentors.filter(item => mentor_admin_allow_list.includes(item.id));
      // console.log(public_admin_allowed_mentor);
      
      return public_admin_allowed_mentor ?? [];
    },
    ["mentors-list"],
    { revalidate: 3600, tags: ["mentors"] },
  );

export default async function Mentors() {
  // const supabase = await createClient();
  // const { data: mentors } = await supabase.from("mentors").select("*").limit(3);
  // console.log(mentors);
  // const mentors = await fetch(`${API_URL}mentors?limit=3`, {
  //   headers: {
  //     "X-MICROCMS-API-KEY": API_KEY,
  //   },
  //   next: { revalidate: 10, tags: ["mentor"] },
  // }).then((res) => res.json());
  // console.log(mentors);
  const supabase = await createClient();
  const mentors = await getMentors(supabase)();
  return (
    <>
      <Mentor mentors={mentors} />
    </>
  );
}
