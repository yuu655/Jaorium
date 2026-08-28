import Image from "next/image";
import { Laptop, MessagesSquare, Clock } from "lucide-react";

const R2_LP_URL = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/LP`;

const items = [
  {
    icon: Laptop,
    title: "ネットの情報が多すぎて、何が正しいか分からない",
    body: "ネットやSNSには情報があふれていて、結局どれを信じればいいのか分からない…。自分に合った情報にたどり着けない。",
    image: `${R2_LP_URL}/sympathy/1.webp`,
  },
  {
    icon: MessagesSquare,
    title: "実際に受かった先輩に話を聞くのは難しい",
    body: "学校や塾に自分の志望校の先輩がいない。聞きたくても、知り合いがいなくて相談できない。",
    image: `${R2_LP_URL}/sympathy/2.webp`,
  },
  {
    icon: Clock,
    title: "オープンキャンパスは時間もお金もかかる",
    body: "遠方の大学に行くには交通費や宿泊費がかかるし、日程も限られていて、気軽に行けない。",
    image: `${R2_LP_URL}/sympathy/3.webp`,
  },
];

export default function SympathySection() {
  return (
    <section id="sympathy" className="bg-slate-50 py-14 lg:py-24 px-6">
      <div className="max-w-350 mx-auto">
        <h2 className="text-center text-2xl lg:text-4xl font-bold text-slate-900 leading-relaxed lg:leading-snug">
          受験、こんなことで
          <br className="lg:hidden" />
          <span className="text-blue-600">悩んで</span>いませんか
        </h2>
        <div className="w-13 h-1 rounded-full bg-blue-600 mx-auto mt-3.5 mb-7 lg:mb-11" />

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-7">
          {items.map(({ icon: ItemIcon, title, body, image }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-5.5 lg:p-7 shadow-[0_2px_14px_rgba(31,35,40,.06)]"
            >
              <div className="flex gap-3.5 items-center mb-4.5">
                <div className="flex-none w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <ItemIcon className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-bold text-base lg:text-lg text-slate-900 leading-snug">
                  {title}
                </p>
              </div>
              <div className="relative h-37.5 lg:h-50 rounded-xl overflow-hidden mb-4">
                <Image src={image} alt="" fill className="object-cover" />
              </div>
              <p className="text-lg text-slate-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
