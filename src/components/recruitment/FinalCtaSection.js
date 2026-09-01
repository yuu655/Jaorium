import Link from "next/link";
import Image from "next/image";

export default function FinalCtaSection() {
  return (
    <section className="bg-[#F5F8FF] px-5.5 pt-8.5 pb-9.5 lg:px-14 lg:pt-17.5 lg:pb-20">
      <div className="mx-auto max-w-250 rounded-[14px] bg-white px-5 py-6 shadow-[0_8px_24px_rgba(31,58,147,.08)] lg:flex lg:items-center lg:justify-between lg:gap-12 lg:rounded-2xl lg:px-12 lg:py-9.5 lg:shadow-[0_8px_28px_rgba(31,58,147,.08)]">
        <div className="mb-5 flex items-center gap-4 lg:mb-0 lg:gap-7">
          <div className="relative h-14 w-14 flex-none lg:h-20 lg:w-20">
            <Image
              src="/forMentors_optimized/about/logo.webp"
              alt="JaoRium"
              fill
              className="object-contain"
            />
          </div>
          <p className="text-xl leading-relaxed font-bold text-[#1F2328] lg:text-[30px]">
            あなたの経験が、
            <br />
            次の受験生の一歩を支えます。
          </p>
        </div>

        <div className="flex-none lg:text-center">
          <Link
            href="/signup/mentor"
            className="flex items-center justify-center gap-3 rounded-full bg-blue-600 p-4.25 text-lg leading-none font-bold text-white transition-colors hover:bg-blue-700 lg:gap-4 lg:px-11 lg:py-4.75 lg:text-xl"
          >
            <span>メンターに登録する</span>
            <span aria-hidden className="text-base font-normal lg:text-lg">
              ›
            </span>
          </Link>
          <p className="mt-3 text-center text-[12.5px] leading-relaxed text-[#2F5FD0] lg:text-[13.5px]">
            登録3分・シフトなし・いつでも辞められます
          </p>
        </div>
      </div>
    </section>
  );
}
