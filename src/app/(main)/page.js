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

export default async function Home() {
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
        <Mentors />
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
