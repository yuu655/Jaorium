import Image from "next/image";

const voices = [
  {
    image: "/forMentors_optimized/seniorMentors/1.webp",
    profile: "九州大学 法学部 2年",
    body: "自分の経験が誰かの役に立っていると実感できて嬉しいです。スライドがあるので、話す内容に迷うこともありませんでした。",
  },
  {
    image: "/forMentors_optimized/seniorMentors/2.webp",
    profile: "早稲田大学 教育学部 3年",
    body: "高校生のリアルな質問に答えるのはやりがいがあります。自分の受験を振り返る良い機会にもなりました。",
  },
  {
    image: "/forMentors_optimized/seniorMentors/3.webp",
    profile: "大阪大学 工学部 4年",
    body: "資料を使うことで、話が整理されて伝えやすかったです。短い時間でもしっかり価値を届けることができました。",
  },
];

export default function SeniorMentorsSection() {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-375 px-5.5 pt-9 pb-8.5 lg:px-14 lg:pt-21 lg:pb-22.5">
        <div className="mb-6 flex items-center justify-center gap-6.5 lg:mb-13">
          <span className="hidden h-px w-30 bg-[#D8DCE1] lg:block" />
          <h2 className="text-[23px] leading-[1.5] font-bold text-[#1F2328] lg:text-[37px] lg:leading-[1.45]">
            先輩メンターの声
          </h2>
          <span className="hidden h-px w-30 bg-[#D8DCE1] lg:block" />
        </div>

        <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-3 lg:gap-7">
          {voices.map((voice) => (
            <div
              key={voice.profile}
              className="flex gap-3.5 rounded-xl border border-[#E4E7EB] bg-white p-4 lg:gap-5.5 lg:rounded-[14px] lg:p-6"
            >
              <div className="relative h-22 w-22 flex-none overflow-hidden rounded-lg bg-slate-50 lg:h-37.5 lg:w-32.5 lg:rounded-[10px]">
                <Image src={voice.image} alt="" fill className="object-cover" />
              </div>
              <div>
                <p className="mb-1.75 text-[14px] leading-snug font-bold text-blue-600 lg:mb-3 lg:text-base">
                  {voice.profile}
                </p>
                <p className="text-[13.5px] leading-loose text-[#5A626C] lg:text-[14.5px] lg:leading-[1.9]">
                  {voice.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
