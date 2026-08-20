import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const bubbles = [
  "面接ってどんなこと聞かれたの？",
  "２つの大学学部で迷ってるけど違いがわからない…",
  "共通テストの勉強法が知りたい！",
];

function HeroCopy() {
  return (
    <>
      <h1 className="lg:pt-7 lg:pb-3 text-3xl lg:text-5xl font-bold leading-[1.4] lg:leading-[1.35] tracking-tight text-slate-900">
        志望校の先輩から
        <br />
        <span className="text-blue-600">受験の一次情報</span> を
        <br />
        直接もらえる。
      </h1>
      <p className="mt-5 lg:mt-8 text-lg leading-loose text-slate-600">
        JaoRiumは、聞きたいときに、聞きたい人に、知りたい情報を聞ける<br className="hidden lg:block"/>受験生のための新しいオンライン面談サービスです。
      </p>

      <div className="mt-7 lg:mt-10 flex flex-col lg:flex-row lg:items-start gap-6">
        <div>
          <Button
            asChild
            size="lg"
            className="w-full lg:w-auto h-auto rounded-lg bg-blue-600 px-10 py-4.5 text-base font-bold hover:bg-blue-700"
          >
            <Link href="/mentors">無料でメンターを探す</Link>
          </Button>
          <p className="mt-3 text-center lg:text-left text-xs text-slate-500">
            登録1分で、すぐに面談予約が可能です。
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-1 text-base font-medium text-blue-600">
          <Link href="/concept" className="hover:underline">
            サービスを詳しく見る　→
          </Link>
          <Link href="/concept" className="hover:underline">
            保護者の方へ　→
          </Link>
        </div>
      </div>
    </>
  );
}

export default function HeroSection() {
  return (
    <section className="bg-slate-50">
      {/* Mobile: image banner with overlaid bubbles directly under header, text block below */}
      <div className="lg:hidden">
        <div className="relative h-57.5 bg-blue-50 overflow-hidden">
          <Image
            src="/jaorium_LP/hero/hero_girl.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_20%]"
          />
          <div className="width-50% absolute left-4 top-4.5 flex flex-col gap-2.5">
            {bubbles.map((text) => (
              <div
                key={text}
                className="max-w-62.5 bg-white rounded-tl-xl rounded-tr-xl rounded-bl-sm rounded-br-xl px-3.5 py-2.5 text-xs leading-relaxed text-slate-800 shadow-md"
              >
                {text}
              </div>
            ))}
          </div>
        </div>
        <div className="px-5.5 pt-8.5 pb-7">
          <HeroCopy />
        </div>
      </div>

      {/* Desktop: full-bleed background image, text left, bubbles floating right */}
      <div className="hidden lg:block relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/jaorium_LP/hero/hero_girl.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[78%_38%]"
          />
        </div>

        <div className="relative max-w-350 mx-auto px-6 pt-18 pb-24 flex justify-between items-start gap-10">
          <div className="max-w-xl">
            <HeroCopy />
          </div>

          <div className="flex flex-col gap-4 w-52 shrink-0 absolute 2xl:right-[25%] lg:right-[33%] top-[21%]">
            {bubbles.map((text) => (
              <div
                key={text}
                className="lg:text-lg bg-white rounded-tl-2xl rounded-tr-2xl rounded-bl-sm rounded-br-2xl px-5 py-4 text-base leading-relaxed text-slate-800 shadow-lg"
              >
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
