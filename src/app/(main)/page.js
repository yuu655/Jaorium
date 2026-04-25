import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

import Header from "@/components/header";
import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Concept from "@/components/concept";
import AdContact from "@/components/adContact";
import Mentors from "@/components/mentors";
import Articles from "@/components/articles";
import TimeLine from "@/components/timeLine";
import HowWork from "@/components/howWork";
import ForCompany from "@/components/forCompany";
import Features from "@/components/features";

const getMentors = (supabase) =>
  unstable_cache(
    async () => {
      const { data: mentors } = await supabase.from("public_mentors").select("*");
      return mentors ?? [];
    },
    ["mentors-list"],
    { revalidate: 10000, tags: ["mentors"] },
  );

export default async function Home() {
  const supabase = await createClient();
  const mentors = await getMentors(supabase)();
  return (
    <>
      {/* <Header propClassName="bg-white shadow-md relative z-0" /> */}

      <Hero />
      
      <Concept />
      {/* <section>
        <TimeLine />
      </section> */}
      <Features />
      <section>
        <Mentors mentors={mentors} />
      </section>
      <section>
        <HowWork />
      </section>
      {/* <section>
        <AdContact />
      </section> */}
      <section>
        <Articles />
      </section>

      {/* <ForCompany /> */}

      

      {/* <div className="flex min-h-screen items-center justify-center bg-white">
        <main className="flex min-h-screen w-full max-w-5xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
          <Link href={`/articles`}>ニュース</Link>
        </main>
      </div> */}
    </>
  );
}
