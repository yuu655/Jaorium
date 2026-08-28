
import Mentor from "@/components/mentors/mentorsListing";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchMentorDirectory } from "@/lib/mentorDirectory";
import MentorSearch from "@/components/common/mentorSearch";

export const metadata = {
  title: "メンター一覧",
  description: "Jaoriumに所属するメンター一覧",
};


const getMentors = (supabase) =>
  unstable_cache(
    async () => fetchMentorDirectory(supabase),
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
  // const { id } = await params;
  const supabase = await createClient();
  const { mentors, mentorTagsMap, tags } = await getMentors(supabase)();
  
  return (
    <>
    <div className="bg-white">
      <MentorSearch mentors={mentors} mentorTagsMap={mentorTagsMap} tags={tags}>
        <Mentor/>
      </MentorSearch>

    </div>
    </>
  );
}
