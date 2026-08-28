import { Button } from "@/components/ui/button";
import Mentor from "@/components/mentor";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import MentorSearch from "@/components/common/mentorSearch";
import MentorSearchInner from "./mentorSearch";
import { fetchMentorDirectory } from "@/lib/mentorDirectory";
import { buildTagById, getMentorTags } from "@/lib/mentorFilter";

const getMentors = (supabase) =>
  unstable_cache(
    async () => {
      const { mentors, mentorTagsMap, tags } =
        await fetchMentorDirectory(supabase);
      return {
        mentors: mentors.slice(0, 3),
        allMentors: mentors,
        mentorTagsMap,
        tags,
      };
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
  const { mentors, allMentors, mentorTagsMap, tags } = await getMentors(supabase)();
  const tagById = buildTagById(tags);
  return (
    <>
      <div className="bg-gray-50">
        <div className="max-w-300 mx-auto px-6 pt-30 pb-20 flex items-center flex-col">
          <h2 className="text-4xl font-bold text-center">メンター紹介</h2>
          <p className="text-center text-xl text-gray-600 pt-3">
            全国の大学生が、あなたの相談を待っています。
          </p>
          <MentorSearch
            mentors={allMentors}
            mentorTagsMap={mentorTagsMap}
            tags={tags}
            /* トップの診断結果はカード内に収める見せ方なので3列×3行ぶんで区切る */
            pageSize={9}
          >
            <MentorSearchInner />
          </MentorSearch>
          <ul className="flex flex-col justify-center py-10 gap-10 w-full md:flex-row">
            {mentors.map((mentor) => (
              <li key={mentor.id} className="w-full h-full md:w-1/3">
                {/* <Mentor
                icon_url={mentor.icon.url}
                name={mentor.name}
                university={mentor.university}
                faculty={mentor.faculty}
                region={mentor.region}
                specialties={mentor.specialties}
              /> */}
                <Mentor
                  mentor={mentor}
                  isTop={true}
                  tagNames={getMentorTags(mentor.id, mentorTagsMap, tagById)}
                />
              </li>
            ))}
          </ul>
          <Button variant="outline" size="mentor" asChild className="mx-auto">
            <Link className="text-[20px]" href="/mentors">
              もっと見る
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
