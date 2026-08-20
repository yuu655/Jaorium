import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

import HeroSection from "@/components/lpTemp/HeroSection";
import RegisteredMentorsStrip from "@/components/lpTemp/RegisteredMentorsStrip";
import SympathySection from "@/components/lpTemp/SympathySection";
import SolutionSection from "@/components/lpTemp/SolutionSection";
import MentorsSection from "@/components/lpTemp/MentorsSection";
import FeaturesSection from "@/components/lpTemp/FeaturesSection";
import ReviewsSection from "@/components/lpTemp/ReviewsSection";
import TargetUsersSection from "@/components/lpTemp/TargetUsersSection";
import HowToStartSection from "@/components/lpTemp/HowToStartSection";
import ArticlesSection from "@/components/lpTemp/ArticlesSection";
import FaqSection from "@/components/lpTemp/FaqSection";
import FinalCtaSection from "@/components/lpTemp/FinalCtaSection";
import MobileStickyCta from "@/components/lpTemp/MobileStickyCta";

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
      const [{ data: mentors }, { data: tags }] = await Promise.all([
        supabase.from("public_mentors").select("*"),
        supabase.from("tags").select("*"),
      ]);

      const mentorTagsMap = Object.fromEntries(
        await Promise.all(
          (mentors ?? []).map(async (mentor) => [
            mentor.id,
            await fetchMentorTags(mentor.id, supabase),
          ]),
        ),
      );

      return {
        allMentors: mentors ?? [],
        mentorTagsMap,
        tags,
      };
    },
    ["mentors-list"],
    { revalidate: 3600, tags: ["mentors"] },
  );

export const metadata = {
  title: "JaoRium | 情報戦に、終止符を。（LP案）",
};

export default async function LpTemp() {
  const supabase = await createClient();
  const { allMentors, mentorTagsMap, tags } = await getMentors(supabase)();

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      <HeroSection />
      <RegisteredMentorsStrip
        mentors={allMentors}
        mentorTagsMap={mentorTagsMap}
        tags={tags}
      />
      <SympathySection />
      <SolutionSection />
      <MentorsSection
        mentors={allMentors}
        mentorTagsMap={mentorTagsMap}
        tags={tags}
      />
      <FeaturesSection />
      <ReviewsSection />
      <TargetUsersSection />
      <HowToStartSection />
      <ArticlesSection />
      <FaqSection />
      <FinalCtaSection />
      <MobileStickyCta />
    </div>
  );
}
