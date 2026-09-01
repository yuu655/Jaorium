import Image from "next/image";

const topics = [
  {
    no: "01",
    title: "いつから受験勉強を始めたか",
    body: "学年ごとの勉強時間や取り組み方、モチベーションの保ち方などを伝えます。",
  },
  {
    no: "02",
    title: "面接はどう乗り越えたか",
    body: "実際の質問内容や準備方法、当日の雰囲気や工夫したことを共有します。",
  },
  {
    no: "03",
    title: "受験で苦労したこと",
    body: "不安や挫折、乗り越え方など、リアルな経験が高校生の支えになります。",
  },
  {
    no: "04",
    title: "大学に入ってみて学びたいことを学べているか",
    body: "大学生活や授業、研究、サークルなどの実体験を伝えます。",
  },
  {
    no: "05",
    title: "高校生からもらった質問",
    body: "高校生の疑問や悩みに、自由にお答えいただきます。",
  },
];

export default function MeetingContentsSection() {
  return (
    <section id="meeting" className="mx-auto max-w-375 px-5.5 pt-9 pb-8.5 lg:px-14 lg:pt-21 lg:pb-22.5">
      <h2 className="mb-2.5 text-center text-[23px] leading-[1.5] font-bold text-[#1F2328] lg:mb-4 lg:text-[39px] lg:leading-[1.45] lg:tracking-tight">
        面談内容について
      </h2>
      <p className="mb-5.5 text-center text-[13px] leading-relaxed text-gray-500 lg:mb-15 lg:text-[15px]">
        ※面談では運営が作成したスライドを用いて話します。
      </p>

      <div className="lg:grid lg:grid-cols-[480px_1fr] lg:items-start lg:gap-18">
        <div className="relative mb-5.5 h-50 overflow-hidden rounded-xl bg-slate-50 lg:mb-0 lg:h-135 lg:rounded-[14px]">
          <Image
            src="/forMentors_optimized/meetingContents/1.webp"
            alt="面談で使用するスライドのイメージ"
            fill
            className="object-cover"
          />
        </div>

        <div>
          <div className="flex flex-col">
            {topics.map((topic, index) => (
              <div
                key={topic.no}
                className={`flex items-start gap-3.25 py-4 lg:gap-6 lg:py-6 ${
                  index === topics.length - 1
                    ? ""
                    : "border-b border-[#ECEEF1]"
                }`}
              >
                <div className="flex h-7.5 w-7.5 flex-none items-center justify-center rounded-full bg-[#EFF4FE] text-[12px] font-bold text-blue-600 lg:h-12 lg:w-12 lg:text-lg">
                  {topic.no}
                </div>
                <div>
                  <h3 className="mb-1.25 text-[15.5px] leading-snug font-bold text-[#1F2328] lg:mb-2.25 lg:text-[22px] lg:leading-[1.5]">
                    {topic.title}
                  </h3>
                  <p className="text-[13.5px] leading-loose text-[#5A626C] lg:text-[15px]">
                    {topic.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4.5 rounded-[10px] bg-[#EFF4FE] p-4 text-[13.5px] leading-loose text-[#2F5FD0] lg:mt-8.5 lg:rounded-xl lg:px-7 lg:py-6 lg:text-[15px]">
            上記は一例であり、あなたの経験や知識、高校生からの質問によって話す内容は変わってきます。
          </p>
        </div>
      </div>
    </section>
  );
}
