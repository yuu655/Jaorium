import Image from "next/image";
import { FileText, Star, TrendingUp, ChevronsRight, ChevronsLeft, Quote } from "lucide-react";

const R2_LP_URL = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/LP`;

const stats = [
  {
    icon: FileText,
    value: "100",
    unit: "%",
    label: "高校では得られない情報が得られた",
    note: "役立つリアルな情報を得られたと回答",
  },
  {
    icon: Star,
    value: "9.7",
    unit: "/10",
    label: "おすすめ度の平均",
    note: "非常に高い満足度をいただいています",
    stars: true,
  },
  {
    icon: TrendingUp,
    value: "66.7",
    unit: "%",
    label: "面談後、進路の迷いが減った",
    note: "進路の不安や迷いが軽くなったと回答",
  },
];

const voices = [
  {
    quote: "大学生にしか分からない大学のリアルを知ることができ、大学入学後の自分を想像できました。",
    tag: "高校2年生",
    image: `${R2_LP_URL}/sympathy/1.webp`,
  },
  {
    quote: "勉強の仕方や考え方、総合型の情報を教えてもらえて、とても参考になりました。",
    tag: "高校3年生",
    image: `${R2_LP_URL}/sympathy/2.webp`,
  },
  {
    quote: "九大生から、受験までの流れや対策、メンタルの保ち方、計画の大切さを知ることができました。",
    tag: "高校3年生",
    image: `${R2_LP_URL}/sympathy/3.webp`,
  },
];

export default function ReviewsSection() {
  return (
    <section className="bg-white py-14 lg:py-24 px-6">
      <div className="max-w-350 mx-auto">
        <h2 className="text-center text-2xl lg:text-5xl font-bold text-slate-900 mb-3 lg:mb-4">
          実際に使った高校生の声
        </h2>
        <p className="text-center text-base text-slate-600 mb-7 lg:mb-12">
          面談を通して、学校では得にくい一次情報や進路のヒントが届いています。
        </p>

        <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-3 lg:gap-7">
          {stats.map(({ icon: StatIcon, value, unit, label, note, stars }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-5.5 lg:p-8.5 shadow-[0_2px_14px_rgba(31,35,40,.06)]"
            >
              <div className="flex gap-4 lg:gap-5.5 items-start">
                <div className="flex-none w-13.5 h-13.5 lg:w-16.5 lg:h-16.5 rounded-full bg-blue-50 flex items-center justify-center">
                  <StatIcon className="w-6.5 h-6.5 lg:w-7.5 lg:h-7.5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-4xl lg:text-5xl font-bold tracking-tight text-blue-700">
                      {value}
                    </span>
                    <span className="text-lg lg:text-xl font-bold text-blue-700">
                      {unit}
                    </span>
                  </div>
                  <p className="font-bold text-base text-slate-900 mt-2.5">
                    {label}
                  </p>
                  {stars && (
                    <div className="flex gap-1.5 mt-2.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-4.5 h-4.5 text-blue-600 fill-blue-600" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-400">{note}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3.5 lg:gap-6 my-10 lg:my-16">
          <div className="flex-1 h-px bg-slate-200" />
          <div className="flex items-center gap-2.5 lg:gap-3.5">
            <ChevronsRight className="w-4.5 h-4.5 lg:w-5.5 lg:h-5.5 text-blue-600" />
            <span className="font-bold text-lg lg:text-3xl text-slate-900">
              利用者の声
            </span>
            <ChevronsLeft className="w-4.5 h-4.5 lg:w-5.5 lg:h-5.5 text-blue-600" />
          </div>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-3 lg:gap-7">
          {voices.map(({ quote, tag, image }) => (
            <div
              key={quote}
              className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_14px_rgba(31,35,40,.06)] flex lg:grid lg:grid-cols-[0.8fr_1fr]"
            >
              <div className="relative flex-none w-30 lg:w-auto min-h-full lg:min-h-67.5">
                <Image src={image} alt="" fill className="object-cover" />
              </div>
              <div className="p-4.5 lg:p-6.5 flex-1 flex flex-col justify-center">
                <Quote className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 fill-blue-600 mb-2.5" />
                <p className="text-base font-medium text-slate-900 leading-loose">
                  {quote}
                </p>
                <span className="inline-block w-fit mt-5 bg-blue-50 rounded-lg px-3.5 py-1.5 text-xs text-blue-600">
                  {tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
