import Image from "next/image";
import { Sparkles, MessagesSquare } from "lucide-react";

const fruits = [
  {
    Icon: Sparkles,
    title: "受験の経験が、そのまま価値になる",
    body: "志望校の選び方、模試の判定との向き合い方、直前期の過ごし方。自分では当たり前だと思っていたことが、高校生にとっては知りたくても手に入らない情報です。うまくいったことも、失敗したことも、迷った時間も。すべてが後輩の役に立ちます。",
    image: "/forMentors_optimized/fruits/1.webp",
  },
  {
    Icon: MessagesSquare,
    title: "初対面の相手に、40分間話す経験",
    body: "高校生の質問に合わせて、自分の経験を組み立てて伝える。資料を使いながら、相手の反応を見て話す。就活の面接やグループディスカッションで話せる経験にもなります。",
    image: "/forMentors_optimized/fruits/2.webp",
  },
];

export default function FruitsSection() {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-375 px-5.5 pt-9 pb-8.5 lg:px-14 lg:pt-21 lg:pb-22.5">
        <h2 className="mb-2.5 text-[23px] leading-[1.5] font-bold text-[#1F2328] lg:mb-3.5 lg:text-[37px] lg:leading-[1.45] lg:tracking-tight">
          やってみて残るもの
        </h2>
        <div className="mb-6 h-0.75 w-14 bg-[#1F3A93] lg:mb-11 lg:w-20" />

        <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-2 lg:gap-7">
          {fruits.map(({ Icon, title, body, image }) => (
            <div
              key={title}
              className="rounded-xl border border-[#DCE6F8] bg-white p-4.5 lg:grid lg:grid-cols-[64px_1fr] lg:items-start lg:gap-6 lg:rounded-[14px] lg:p-8.5"
            >
              <div className="mb-3.5 flex items-center gap-3.5 lg:mb-0 lg:block">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-blue-600 lg:h-14 lg:w-14">
                  <Icon className="h-5 w-5 text-white lg:h-6.5 lg:w-6.5" />
                </div>
                <h3 className="text-[17px] leading-snug font-bold text-[#1F2328] lg:hidden">
                  {title}
                </h3>
              </div>

              <div>
                <h3 className="mb-3.5 hidden text-[23px] leading-relaxed font-bold text-[#1F2328] lg:block">
                  {title}
                </h3>
                <p className="mb-4 border-t border-[#E4E7EB] pt-3.5 text-[13.5px] leading-[1.9] text-[#5A626C] lg:mb-5.5 lg:pt-4.5 lg:text-[15.5px] lg:leading-[2]">
                  {body}
                </p>
                <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-slate-50 lg:rounded-[10px]">
                  <Image src={image} alt="" fill className="object-contain" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
