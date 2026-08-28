
import Mentor from "@/components/mentors/mentorsListing";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import MentorSearch from "@/components/common/mentorSearch";

export const metadata = {
  title: "メンター一覧",
  description: "Jaoriumに所属するメンター一覧",
};


const fetchMentorTags = async (mentorId, supabase) => {
    const { data } = await supabase
      .from("mentor_tags")
      .select("tag_id")
      .eq("mentor_id", mentorId);
    return data;
  };

const hasIcon = (mentor) => Boolean(mentor?.icon);

const getMentors = (supabase) =>
  unstable_cache(
    async () => {
      // mentor_secretはRLSで本人しか読めず、一般ユーザー・未ログインからは0行になる。
      // admin_allowでの絞り込みはpublic_mentorsビュー(公開カラムのみ)に任せる。
      const [{ data: mentors }, { data: tags }] = await Promise.all([
        supabase.from("public_mentors").select("*"),
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

      await Promise.all(mentors.map(async (mentor) => {
        const{ data: review_sum } = await supabase.from("review_sum").select("star_avg").eq("mentor_id", mentor.id).single();
        mentor.review_sum = review_sum?.star_avg || 0;
      }));

      // アイコンを設定しているメンターを先に表示する(同条件内の順序は元のまま)。
      const sortedMentors = [...(mentors ?? [])].sort(
        (a, b) => hasIcon(b) - hasIcon(a),
      );

      return { mentors: sortedMentors, mentorTagsMap, tags };
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
