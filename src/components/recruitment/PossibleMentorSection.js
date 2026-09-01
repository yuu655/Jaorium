import Image from "next/image";

const conditions = [
  {
    image: "/forMentors_optimized/possibleMentor/1.webp",
    title: (
      <>
        大学・学部・学年は
        <br className="hidden lg:block" />
        問いません
      </>
    ),
    body: "所属や学年を問わず、さまざまな大学・分野の先輩が活躍しています。",
  },
  {
    image: "/forMentors_optimized/possibleMentor/2.webp",
    title: (
      <>
        指導経験は
        <br className="hidden lg:block" />
        不要です
      </>
    ),
    body: "特別なスキルや指導経験がなくても大丈夫。丁寧なサポート体制があるので安心して始められます。",
  },
  {
    image: "/forMentors_optimized/possibleMentor/3.webp",
    title: (
      <>
        一般入試も、総合型・推薦も、
        <br className="hidden lg:block" />
        帰国子女枠も。
      </>
    ),
    body: "どの入試方式で合格した方も歓迎です。あなたの経験が、誰かの力になります。",
  },
];

export default function PossibleMentorSection() {
  return (
    <section className="mx-auto max-w-375 px-5.5 pt-9 pb-8.5 lg:grid lg:grid-cols-[360px_1fr] lg:items-start lg:gap-14 lg:px-14 lg:pt-21 lg:pb-22.5">
      <div className="lg:pt-2">
        <p className="mb-2.5 text-[12px] leading-none font-bold tracking-[.12em] text-blue-600 lg:mb-3.5 lg:text-[13px]">
          JAORIUM MENTOR
        </p>
        <div className="mb-4.5 h-0.75 w-12 bg-[#1F3A93] lg:mb-7 lg:w-16" />
        <h2 className="mb-3 text-[26px] leading-[1.45] font-bold text-[#1F2328] lg:mb-5 lg:text-[44px] lg:tracking-tight lg:leading-[1.4]">
          登録できる方
        </h2>
        <p className="mb-5.5 text-[13.5px] leading-[1.9] text-gray-500 lg:mb-0 lg:text-[15px]">
          受験の記憶が新しいうちほど、後輩に伝えられることがあります。
        </p>
      </div>

      <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-3 lg:gap-6">
        {conditions.map((condition, index) => (
          <div
            key={index}
            className="rounded-xl border border-[#E4E7EB] bg-white p-4 shadow-[0_4px_14px_rgba(31,35,40,.04)] lg:rounded-[14px] lg:p-5 lg:shadow-[0_4px_16px_rgba(31,35,40,.05)]"
          >
            <div className="relative mb-4 aspect-4/3 overflow-hidden rounded-lg bg-slate-50 lg:mb-5 lg:rounded-[10px]">
              <Image src={condition.image} alt="" fill className="object-cover" />
            </div>
            <h3 className="mb-3 text-center text-[17px] leading-relaxed font-bold text-[#1F2328] lg:mb-4 lg:text-lg">
              {condition.title}
            </h3>
            <p className="border-t border-dashed border-[#C7D2E4] pt-3 text-center text-[13.5px] leading-[1.85] text-[#5A626C] lg:pt-4 lg:text-[14px] lg:leading-[1.9]">
              {condition.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
