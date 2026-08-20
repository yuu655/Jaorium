import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ChevronsRight,
  ChevronsLeft,
  School,
  BookOpen,
  ClipboardCheck,
  Users,
  Check,
  Search,
} from "lucide-react";

const R2_LP_URL = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/LP`;

const groups = [
  {
    icon: School,
    image: `${R2_LP_URL}/users/1.webp`,
    title: "志望校選びに",
    questions: [
      "◯◯学部と△△学部、実際どう違う？",
      "オープンキャンパスでは分からないことは？",
      "併願校はどう決めましたか？",
    ],
  },
  {
    icon: BookOpen,
    image: `${R2_LP_URL}/users/2.webp`,
    title: "受験勉強について",
    questions: [
      "共通テストの勉強法が知りたい",
      "E判定からどう巻き返しましたか？",
      "部活と両立できましたか？",
    ],
  },
  {
    icon: ClipboardCheck,
    image: `${R2_LP_URL}/users/3.webp`,
    title: "入試本番について",
    questions: [
      "面接って何を聞かれたの？",
      "志望理由書はどう書きましたか？",
      "試験当日はどう過ごしましたか？",
    ],
  },
  {
    icon: Users,
    image: `${R2_LP_URL}/users/4.webp`,
    title: "入学してからのこと",
    questions: [
      "実際に通ってみてギャップはありましたか？",
      "一人暮らしのお金って実際どのくらい？",
      "サークルやバイトはどうしていますか？",
    ],
  },
];

export default function TargetUsersSection() {
  return (
    <section className="bg-slate-50 py-14 lg:py-24 px-6">
      <div className="max-w-350 mx-auto">
        <div className="flex items-center justify-center gap-3 lg:gap-5.5 mb-2.5 lg:mb-3.5">
          <ChevronsRight className="w-4.5 h-4.5 lg:w-6 lg:h-6 text-blue-600" />
          <h2 className="text-2xl lg:text-5xl font-bold text-slate-900">
            こんな人が使っています
          </h2>
          <ChevronsLeft className="w-4.5 h-4.5 lg:w-6 lg:h-6 text-blue-600" />
        </div>
        <p className="text-center text-base text-slate-600 mb-7 lg:mb-11">
          志望校えらびから、入学後のリアルまで。
        </p>

        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-4 lg:gap-6.5">
          {groups.map(({ icon: GroupIcon, image, title, questions }) => (
            <div
              key={title}
              className="bg-white rounded-2xl shadow-[0_2px_14px_rgba(31,35,40,.06)] flex flex-col"
            >
              <div className="relative">
                <div className="relative h-45 lg:h-61 rounded-t-2xl overflow-hidden">
                  <Image src={image} alt="" fill className="object-cover" />
                </div>
                <div className="absolute left-4.5 lg:left-5.5 -bottom-5.5 lg:-bottom-6.5 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <GroupIcon className="w-5.5 h-5.5 lg:w-6.5 lg:h-6.5 text-blue-600" />
                </div>
              </div>
              <div className="px-5 lg:px-6 pt-9.5 lg:pt-11.5 pb-6 lg:pb-7.5 flex-1">
                <p className="text-center font-bold text-lg lg:text-xl text-slate-900">
                  {title}
                </p>
                <div className="w-10 h-0.5 bg-blue-200 mx-auto my-3.5 lg:my-5.5" />
                <div className="flex flex-col gap-3">
                  {questions.map((q) => (
                    <div key={q} className="flex gap-2.5 items-start">
                      <Check className="w-3.75 h-3.75 text-blue-600 shrink-0 mt-1" />
                      <p className="text-base text-slate-700 leading-relaxed">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 lg:mt-8.5 bg-blue-50 rounded-2xl p-6.5 lg:p-8.5 flex flex-col lg:flex-row items-center gap-4.5 lg:gap-7 text-center lg:text-left">
          <div className="flex-none w-15 h-15 lg:w-19 lg:h-19 rounded-full bg-white flex items-center justify-center mx-auto lg:mx-0">
            <Search className="w-7 h-7 lg:w-8.5 lg:h-8.5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-xl lg:text-3xl text-slate-900 mb-2">
              自分に合った先輩を探してみる。
            </p>
            <p className="text-base text-slate-600">
              まずは1回、無料で話してみましょう。
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="w-full lg:w-auto h-auto rounded-lg bg-blue-600 px-8 lg:px-10 py-4.5 lg:py-5.5 text-base lg:text-lg font-bold hover:bg-blue-700"
          >
            <Link href="/mentors">無料でメンターを探す</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
