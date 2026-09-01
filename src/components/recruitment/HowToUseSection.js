import { Fragment } from "react";
import Image from "next/image";

const steps = [
  {
    no: "01",
    image: "/forMentors_optimized/howToUse/1.webp",
    title: "メンター登録",
    body: "WEBサイトから必要情報を入力し、メンターに登録します。",
  },
  {
    no: "02",
    image: "/forMentors_optimized/howToUse/2.webp",
    title: "運営と20分面談",
    body: "運営と20分ほどの面談を行い、あなたの受験体験をお聞きします。",
  },
  {
    no: "03",
    image: "/forMentors_optimized/howToUse/3.webp",
    title: "高校生から選ばれる＆日程調整",
    body: "プロフィールを見た高校生から指名が入ります。日程を調整します。",
  },
  {
    no: "04",
    image: "/forMentors_optimized/howToUse/4.webp",
    title: "高校生と40分間面談",
    body: "オンラインで40分間、スライドを使って高校生の悩みや疑問に答えます。",
  },
];

export default function HowToUseSection() {
  return (
    <section className="bg-[#F5F8FF] lg:border-t lg:border-[#E6EDFB]">
      <div className="mx-auto max-w-375 px-5.5 pt-9 pb-8.5 lg:px-14 lg:pt-21 lg:pb-22.5">
        <div className="mb-2.5 flex items-center justify-center gap-3.5 lg:mb-3.5 lg:gap-5.5">
          <span className="h-px w-10 bg-[#9FB6E6] lg:w-37.5" />
          <h2 className="text-[23px] leading-[1.5] font-bold text-[#1F3A93] lg:text-[37px] lg:leading-[1.45]">
            ご利用の流れ
          </h2>
          <span className="h-px w-10 bg-[#9FB6E6] lg:w-37.5" />
        </div>
        <p className="mb-5.5 text-center text-[13px] leading-loose text-[#5A626C] lg:mb-12 lg:text-[15px]">
          カンタンな4ステップで、すぐにメンターとして活動を始められます。
        </p>

        {/* Mobile: stacked rows */}
        <div className="flex flex-col gap-3 lg:hidden">
          {steps.map((step) => (
            <div
              key={step.no}
              className="flex items-center gap-3.5 rounded-xl bg-white p-4 shadow-[0_4px_14px_rgba(31,58,147,.06)]"
            >
              <div className="relative h-16 w-21 flex-none overflow-hidden rounded-lg bg-slate-50">
                <Image src={step.image} alt="" fill className="object-cover" />
              </div>
              <div>
                <div className="mb-1.25 flex items-baseline gap-2.25">
                  <span className="text-base leading-none font-bold text-blue-600">
                    {step.no}
                  </span>
                  <span className="text-[15.5px] leading-snug font-bold text-[#1F2328]">
                    {step.title}
                  </span>
                </div>
                <p className="text-[13px] leading-loose text-[#5A626C]">{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: four cards joined by chevrons */}
        <div className="hidden grid-cols-[1fr_40px_1fr_40px_1fr_40px_1fr] items-stretch lg:grid">
          {steps.map((step, index) => (
            <Fragment key={step.no}>
              {index > 0 && (
                <div
                  aria-hidden
                  className="flex items-center justify-center text-2xl text-blue-600"
                >
                  ›
                </div>
              )}
              <div className="rounded-[14px] bg-white p-5 shadow-[0_6px_20px_rgba(31,58,147,.07)]">
                <div className="relative mb-4.5 h-37.5 rounded-[10px] bg-slate-50">
                  <Image
                    src={step.image}
                    alt=""
                    fill
                    className="rounded-[10px] object-cover"
                  />
                  <span className="absolute -top-1.5 left-3 text-[37px] leading-none font-bold text-blue-600">
                    {step.no}
                  </span>
                </div>
                <h3 className="mb-2.5 text-center text-lg leading-relaxed font-bold text-[#1F2328]">
                  {step.title}
                </h3>
                <p className="text-center text-[14px] leading-[1.9] text-[#5A626C]">
                  {step.body}
                </p>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
