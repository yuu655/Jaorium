import HeroSection from "@/components/recruitment/HeroSection";
import AboutSection from "@/components/recruitment/AboutSection";
import MeritSection from "@/components/recruitment/MeritSection";
import MeetingContentsSection from "@/components/recruitment/MeetingContentsSection";
import SeniorMentorsSection from "@/components/recruitment/SeniorMentorsSection";
import HowToUseSection from "@/components/recruitment/HowToUseSection";
import PossibleMentorSection from "@/components/recruitment/PossibleMentorSection";
import FruitsSection from "@/components/recruitment/FruitsSection";
import FaqSection from "@/components/recruitment/FaqSection";
import FinalCtaSection from "@/components/recruitment/FinalCtaSection";

export const metadata = {
  title: "メンター募集",
  description:
    "JaoRiumのメンター募集ページ。あなたの受験体験を、40分のオンライン面談で後輩へ届けませんか？固定シフトなし・指導経験不要で始められます。",
};

export default function Recruitment() {
  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      <HeroSection />
      <AboutSection />
      <MeritSection />
      <MeetingContentsSection />
      <SeniorMentorsSection />
      <HowToUseSection />
      <PossibleMentorSection />
      <FruitsSection />
      <FaqSection />
      <FinalCtaSection />
    </div>
  );
}
