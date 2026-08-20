import { UserSearch, CalendarSearch, CircleCheck, ChevronDown, ChevronRight } from "lucide-react";

const steps = [
  {
    icon: UserSearch,
    title: "先輩を探す",
    body: "大学・学部・入試方式などから、自分に合う先輩メンターを探せます。",
  },
  {
    icon: CalendarSearch,
    title: "面談を予約する",
    body: (
      <>
        都合の良い日時を選んで、オンラインで<span className="text-blue-600">45分</span>の面談を予約します。
      </>
    ),
  },
  {
    icon: CircleCheck,
    title: "情報を得て、受験に活かす",
    body: "面談で聞いた一次情報をもとに、自分だけの受験戦略を立てられます。",
  },
];

export default function SolutionSection() {
  return (
    <section className="bg-blue-50/60 py-14 lg:py-24 px-6">
      <div className="max-w-350 mx-auto">
        <h2 className="text-center text-2xl lg:text-4xl font-bold text-slate-900">
          JaoRiumなら
          <span className="text-blue-600 border-b-4 border-blue-600 pb-1">
            全て解決
          </span>
        </h2>

        <div className="mt-8 lg:mt-12 flex flex-col gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center lg:gap-5">
          {steps.map(({ icon: StepIcon, title, body }, index) => (
            <div key={title} className="contents lg:contents">
              <div className="bg-white rounded-2xl p-5.5 lg:p-7.5 shadow-[0_2px_14px_rgba(31,35,40,.06)]">
                <p className="text-xs font-bold tracking-wider text-blue-600 mb-3.5">
                  STEP {index + 1}
                </p>
                <div className="flex items-center gap-4 lg:gap-5">
                  <div className="flex-none w-14.5 h-14.5 lg:w-18 lg:h-18 rounded-full bg-blue-50 flex items-center justify-center">
                    <StepIcon className="w-7 h-7 lg:w-8.5 lg:h-8.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-base lg:text-xl text-slate-900 mb-1.5">
                      {title}
                    </p>
                    <p className="text-base text-slate-600 leading-relaxed">{body}</p>
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ChevronDown className="w-6 h-6 text-blue-600 lg:hidden" />
                  <ChevronRight className="w-7.5 h-7.5 text-blue-600 hidden lg:block" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
