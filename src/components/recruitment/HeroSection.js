import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative bg-slate-50 lg:bg-white">
      {/* Desktop: hero art bleeds across the section, anchored right */}
      <div className="absolute inset-0 mx-auto hidden max-w-375 lg:block">
        <Image
          src="/forMentors_optimized/hero/hero.webp"
          alt=""
          fill
          priority
          className="object-cover object-right"
        />
      </div>

      <div className="relative mx-auto max-w-375 px-5.5 pt-9 pb-8 lg:grid lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16 lg:px-14 lg:pt-22 lg:pb-21">
        <div>
          <p className="mb-4.5 font-mono text-[10px] leading-none font-medium tracking-[.16em] text-gray-500 lg:mb-6.5 lg:text-[11px] lg:tracking-[.18em]">
            MENTOR RECRUITING
          </p>

          <h1 className="mb-5 text-[27px] leading-[1.55] font-bold tracking-tight text-[#1F2328] lg:mb-6.5 lg:text-[46px] lg:leading-[1.45]">
            あなたの受験体験を
            <br />
            <span className="text-blue-600">後輩へ届け</span>ませんか？
          </h1>

          <div className="mb-6.5 flex flex-col gap-2.5 lg:mb-9 lg:gap-3">
            <p className="text-[17px] leading-relaxed text-gray-700 lg:text-2xl">
              40分間のオンライン面談
            </p>
            {/* <p className="text-[17px] leading-relaxed text-gray-700 lg:text-2xl">
              1度の面談で ○○○円 〜 ○○○円
            </p> */}
          </div>

          {/* Mobile: full-width CTA + note underneath */}
          <div className="lg:hidden">
            <Link
              href="/signup/mentor"
              className="block rounded-lg bg-blue-600 py-4.5 text-center text-base leading-none font-bold text-white transition-colors hover:bg-blue-700"
            >
              メンターに登録する
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-gray-500">
              登録3分・シフトなし・いつでも辞められます
            </p>
          </div>

          {/* Desktop: CTA and note side by side */}
          <div className="hidden items-center gap-5 lg:flex">
            <Link
              href="/signup/mentor"
              className="rounded-lg bg-blue-600 px-11.5 py-4.75 text-[17px] leading-none font-bold text-white transition-colors hover:bg-blue-700"
            >
              メンターに登録する
            </Link>
            <p className="text-[13px] leading-relaxed text-gray-500">
              登録3分・シフトなし
              <br />
              いつでも辞められます
            </p>
          </div>
        </div>

        {/* Mobile: art as a full-bleed band closing the section */}
        <div className="relative mt-6.5 -mr-5.5 -mb-8 -ml-5.5 h-57.5 lg:hidden">
          <Image
            src="/forMentors_optimized/hero/1.webp"
            alt=""
            fill
            priority
            className="object-cover object-[center_34%]"
          />
        </div>
      </div>
    </section>
  );
}
