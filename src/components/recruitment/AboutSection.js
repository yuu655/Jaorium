import Image from "next/image";

const ARROW_RIGHT = "polygon(0 30%,72% 30%,72% 0,100% 50%,72% 100%,72% 70%,0 70%)";
const ARROW_LEFT = "polygon(100% 30%,28% 30%,28% 0,0 50%,28% 100%,28% 70%,100% 70%)";

function Arrow({ direction, color }) {
  return (
    <div
      className="h-3.5"
      style={{
        background: color,
        clipPath: direction === "right" ? ARROW_RIGHT : ARROW_LEFT,
      }}
    />
  );
}

function PersonCard({ src, title, caption }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-[10px] border border-[#E4E7EB] bg-white p-4 text-center lg:gap-4 lg:rounded-[14px] lg:px-5 lg:py-7.5">
      <div className="relative order-1 h-18 w-18 lg:order-2 lg:h-26 lg:w-26">
        <Image src={src} alt="" fill className="object-contain" />
      </div>
      <p className="order-2 text-base leading-snug font-bold text-[#1F2328] lg:order-1 lg:text-[21px]">
        {title}
      </p>
      <p className="order-3 text-[12.5px] leading-relaxed text-gray-500 lg:text-[13.5px]">
        {caption}
      </p>
    </div>
  );
}

function JaoRiumCard() {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-[10px] bg-blue-600 p-4.5 text-center lg:gap-4 lg:rounded-[14px] lg:px-5 lg:py-7.5">
      <div className="relative h-18 w-18 overflow-hidden rounded-full bg-white lg:h-26 lg:w-26">
        <Image
          src="/forMentors_optimized/about/logo.webp"
          alt="JaoRium"
          fill
          className="scale-76 object-contain"
        />
      </div>
      <p className="text-lg leading-tight font-bold text-white lg:text-[26px]">
        JaoRium
      </p>
      <p className="text-[12.5px] leading-relaxed text-[#D3E0FB] lg:text-[13.5px]">
        マッチング・日程調整
        <br />
        資料生成・報酬支払い
      </p>
    </div>
  );
}

export default function AboutSection() {
  return (
    <section
      id="about"
      className="mx-auto max-w-375 border-t border-[#ECEEF1] px-5.5 pt-9 pb-8.5 lg:border-0 lg:px-14 lg:pt-21 lg:pb-22.5"
    >
      <p className="mb-3 text-center font-mono text-[11px] leading-none font-medium tracking-[.16em] text-gray-500 lg:mb-4 lg:text-[12px] lg:tracking-[.18em]">
        ABOUT
      </p>
      <h2 className="mb-4.5 text-center text-[23px] leading-[1.5] font-bold text-[#1F2328] lg:mb-7 lg:text-[39px] lg:leading-[1.45] lg:tracking-tight">
        JaoRiumとは
      </h2>

      <p className="mx-auto mb-2.5 max-w-205 text-base leading-loose text-[#1F2328] lg:mb-3 lg:text-center lg:text-[21px]">
        <span className="font-bold">
          受験生と大学生メンターをつなぐマッチングサービス
        </span>
        です。
      </p>
      <p className="mx-auto mb-5 max-w-205 text-[14px] leading-loose text-[#5A626C] lg:mb-6.5 lg:text-center lg:text-base">
        受験に関する悩みを持つ受験生が、志望校や状況の近い先輩を選び、40分のオンライン面談で直接相談できます。
      </p>
      <p className="mx-auto mb-2 max-w-205 text-lg leading-relaxed font-bold text-blue-600 lg:mb-2.5 lg:text-center lg:text-2xl">
        あなたの経験がきっと
        <br className="lg:hidden" />
        後輩の役に立つ。
      </p>
      <p className="mx-auto mb-6.5 max-w-205 text-[14px] leading-loose text-[#5A626C] lg:mb-15 lg:text-center lg:text-base">
        特別な指導力は必要ありません。志望校をどう決め、何に迷い、どう勉強したか。それだけで十分です。
      </p>

      {/* Mobile: stacked flow with text connectors */}
      <div className="flex flex-col items-center rounded-xl border border-[#E4E7EB] bg-slate-50 px-4 py-5 lg:hidden">
        <div className="w-full">
          <PersonCard
            src="/forMentors_optimized/about/1.webp"
            title="大学生メンター"
            caption="受験の経験を提供する"
          />
        </div>
        <p className="py-2.25 text-[12px] leading-relaxed text-[#98A0AA]">
          ↑ 報酬を受け取る　／　↓ 経験を届ける
        </p>
        <div className="w-full">
          <JaoRiumCard />
        </div>
        <p className="py-2.25 text-[12px] leading-relaxed text-[#98A0AA]">
          ↑ 先輩を探す　／　↓ 面談・相談支援
        </p>
        <div className="w-full">
          <PersonCard
            src="/forMentors_optimized/about/2.webp"
            title="受験生"
            caption="受験の悩みを相談する"
          />
        </div>
      </div>

      {/* Desktop: three columns joined by arrow connectors */}
      <div className="mx-auto hidden max-w-300 grid-cols-[280px_1fr_280px_1fr_280px] items-stretch lg:grid">
        <PersonCard
          src="/forMentors_optimized/about/1.webp"
          title="大学生メンター"
          caption="受験の経験を提供する"
        />

        <div className="flex flex-col justify-center gap-4.5 px-6">
          <div>
            <p className="mb-1.75 text-center text-[14.5px] leading-snug font-bold text-[#2F5FD0]">
              経験を届ける
            </p>
            <Arrow direction="right" color="#2563EB" />
          </div>
          <div>
            <Arrow direction="left" color="#C7D2E4" />
            <p className="mt-1.75 text-center text-[14.5px] leading-snug font-bold text-gray-500">
              報酬を受け取る
            </p>
          </div>
        </div>

        <JaoRiumCard />

        <div className="flex flex-col justify-center gap-4.5 px-6">
          <div>
            <p className="mb-1.75 text-center text-[14.5px] leading-snug font-bold text-gray-500">
              先輩を探す
            </p>
            <Arrow direction="left" color="#C7D2E4" />
          </div>
          <div>
            <Arrow direction="right" color="#2563EB" />
            <p className="mt-1.75 text-center text-[14.5px] leading-snug font-bold text-[#2F5FD0]">
              面談・相談支援
            </p>
          </div>
        </div>

        <PersonCard
          src="/forMentors_optimized/about/2.webp"
          title="受験生"
          caption="受験の悩みを相談する"
        />
      </div>
    </section>
  );
}
