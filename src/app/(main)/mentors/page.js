"use server";

import Mentor from "./components/mentors";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import MentorSearch from "@/components/common/mentorSearch";

const fetchMentorTags = async (mentorId, supabase) => {
    const { data } = await supabase
      .from("mentor_tags")
      .select("tag_id")
      .eq("mentor_id", mentorId);
    return data;
  };

const getMentors = (supabase) =>
  unstable_cache(
    async () => {
      const [{ data: mentors }, { data: mentor_admin_allow }, { data: tags }] = await Promise.all([
        supabase.from("mentors").select("*").eq("is_allowed", true),
        supabase.from("mentor_secret").select("*").eq("admin_allow", true),
        supabase.from("tags").select("*"),
      ]);

      const mentorTagsMap = Object.fromEntries(
          await Promise.all(
            mentors.map(async (mentor) => [
              mentor.id,
              await fetchMentorTags(mentor.id, supabase),
            ]),
          ),
        );


      // const { data: mentors } = await supabase
      //   .from("mentors")
      //   .select("*")
      //   .limit(3);

      const mentor_admin_allow_list = mentor_admin_allow.map(item => item.id);
      const public_admin_allowed_mentor = mentors.filter(item => mentor_admin_allow_list.includes(item.id));

      await Promise.all(public_admin_allowed_mentor.map(async (mentor) => {
        const{ data: review_sum } = await supabase.from("review_sum").select("star_avg").eq("mentor_id", mentor.id).single();
        mentor.review_sum = review_sum?.star_avg || 0;
      }));
      // console.log(public_admin_allowed_mentor);
      
      return { mentors: public_admin_allowed_mentor ?? [], mentorTagsMap, tags };
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
