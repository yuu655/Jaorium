"use client";
import Image from "next/image";
import Link from "next/link";
import FadeIn from "./common/FadeIn";


/* ── 吹き出し ── */
function Bubble({ top, lines }) {
  return (
    <div
      className="absolute right-4 md:right-5 bg-white border-[1.5px] border-gray-200 rounded-xl px-3 py-2 md:px-[18px] md:py-[10px] text-[11px] md:text-[12px] font-medium text-gray-950 text-center shadow-lg whitespace-nowrap z-10"
      style={{ top }}
    >
      {/* 外枠の矢印 */}
      <span className="absolute -left-2 top-[13px] border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-r-[8px] border-r-gray-200" />
      {/* 内側の白い矢印 */}
      <span className="absolute -left-[6px] top-[14px] border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[7px] border-r-white" />
      
      {lines.map((l, i) => (
        <span key={i} className="block leading-[1.55]">
          {l}
        </span>
      ))}
    </div>
  );
}

/* ── §1 ヒーロー ── */
function HeroSection() {
  const badges = [
    {
      text: ["志望校の先輩と", "１対１で話せる"],
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="w-[22px] h-[22px] stroke-white fill-none stroke-[1.8]"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      text: ["聞きたいことを", "自由に質問できる"],
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="w-[22px] h-[22px] stroke-white fill-none stroke-[1.8]"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      ),
    },
    {
      text: ["安心・安全の", "オンライン面談"],
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="w-[22px] h-[22px] stroke-white fill-none stroke-[1.8]"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="bg-white">
      {/* 上段 */}
      <div className="max-w-[1100px] mx-auto px-4 md:pl-14 md:pr-4 grid grid-cols-1 lg:grid-cols-[420px_1fr] items-stretch">
        {/* 左テキスト */}
        <FadeIn className="pt-10 pb-6 md:py-13 pr-0 lg:pr-10 flex flex-col justify-center">
          <h1 className="text-3xl md:text-[42px] font-black leading-[1.35] tracking-tight text-gray-950 mb-5 md:mb-[22px]">
            志望校の先輩から
            <br />
            <span
              className="text-blue-600 pb-1"
              style={{
                backgroundRepeat: "repeat-x",
                backgroundPosition: "bottom 0 left 0",
                backgroundSize: "20px 6px",
              }}
            >
              受験の一次情報
            </span>{" "}
            を
            <br />
            直接もらえる。
          </h1>
          <p className="text-[14px] text-gray-700 leading-[1.9]">
            JaoRiumは、聞きたいときに、
            <br />
            聞きたい人に、知りたい情報を聞ける
            <br />
            受験生のための新しいオンライン面談サービスです。
          </p>
        </FadeIn>

        {/* 右：写真＋吹き出し */}
        <FadeIn delay={80} className="relative overflow-visible h-[380px] sm:h-[450px] lg:h-auto w-full min-h-[380px]">
          <Image
            src="/heroGirl.png"
            alt="女子高生"
            fill
            className="object-cover object-top"
          />
          <Bubble top={32} lines={["「面接ってどんなこと", "聞かれたの？」"]} />
          <Bubble top={150} lines={["「北大農学部と九大農学部", "迷ってるけど…」"]} />
          <Bubble top={280} lines={["「共通テストの", "勉強法が知りたい！」"]} />
        </FadeIn>
      </div>

      {/* 下段：バッジ */}
      <div className="border-t border-gray-100">
        <FadeIn
          delay={160}
          className="max-w-[1100px] mx-auto px-4 py-6 md:px-14 md:py-[28px] flex flex-col sm:flex-row flex-wrap lg:flex-nowrap gap-6 md:gap-[56px] items-start sm:items-center"
        >
          {badges.map((b, i) => (
            <div key={i} className="flex items-center gap-3 shrink-0">
              <div className="w-[46px] h-[46px] rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                {b.icon}
              </div>
              <span className="text-[13px] font-bold text-gray-950 leading-[1.4]">
                {b.text[0]}
                <br />
                {b.text[1]}
              </span>
            </div>
          ))}
        </FadeIn>
      </div>
    </section>
  );
}

/* ── §2 こんなお悩み ── */
function WorriesSection() {
  const items = [
    {
      lines: ["オープンキャンパスに行くのは", "時間もお金もかかる…"],
      src: "/imgTrain.png",
      alt: "新幹線とお金",
    },
    {
      lines: ["実際に受かった先輩に", "話を聞くのは難しい…"],
      src: "/imgWorry.png",
      alt: "悩む女子",
    },
    {
      lines: ["ネットの情報は多いけど、", "何が正しいかわからない…"],
      src: "/imgQuestion.png",
      alt: "悩む男子",
    },
  ];

  return (
    <section className="bg-white px-4 py-12 md:py-16 border-t border-gray-100">
      <div className="max-w-[860px] mx-auto">
        <FadeIn>
          <h2 className="text-center text-2xl md:text-[26px] font-black text-gray-950 tracking-tight mb-9">
            こんなお悩み、ありませんか？
          </h2>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div className="bg-white border-[1.5px] border-gray-200 rounded-xl flex flex-col p-5 md:pt-6 md:pb-5 h-full">
                <p className="text-[14px] font-bold text-gray-950 leading-[1.6] text-left mb-5">
                  {item.lines[0]}
                  <br />
                  {item.lines[1]}
                </p>
                <div className="w-full h-[120px] flex items-center justify-center relative">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── §3 解決ステップ ── */
function SolutionSection() {
  const steps = [
    {
      num: "①",
      label: "先輩を探す",
      sub: ["志望校・学部・条件で", "ぴったりの先輩を見つける"],
      src: "/imgPhone.png",
    },
    {
      num: "②",
      label: "面談する",
      sub: ["オンラインで１対１の", "面談を予約・実施"],
      src: "/imgLaptop.png",
    },
    {
      num: "③",
      label: "情報を得て、受験に活かす",
      sub: ["リアルな体験談やアドバイスで", "自信を持って受験へ"],
      src: "/imgHappy.png",
    },
  ];

  const ArrowIcon = () => (
    <svg
      viewBox="0 0 24 24"
      className="w-[22px] h-[22px] stroke-blue-600 fill-none stroke-[2.5] rotate-90 md:rotate-0"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );

  const cols = [];
  steps.forEach((s, i) => {
    cols.push(
      <FadeIn key={`s${i}`} delay={i * 80}>
        <div className="bg-white border-[1.5px] border-gray-200 rounded-xl p-5 md:px-5 md:pt-[22px] md:pb-[18px] text-center h-full">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[12px] font-black flex items-center justify-center shrink-0">
              {s.num}
            </div>
            <span className="text-[14px] font-bold text-blue-600">
              {s.label}
            </span>
          </div>
          <p className="text-[12px] text-gray-500 leading-[1.65] mb-3.5 text-left">
            {s.sub[0]}
            <br />
            {s.sub[1]}
          </p>
          <div className="relative w-full h-[100px]">
            <Image
              src={s.src}
              alt={s.label}
              fill
              className="object-contain"
            />
          </div>
        </div>
      </FadeIn>
    );
    if (i < steps.length - 1) {
      cols.push(
        <FadeIn
          key={`a${i}`}
          delay={i * 80}
          className="flex items-center justify-center py-2 md:py-0"
        >
          <ArrowIcon />
        </FadeIn>
      );
    }
  });

  return (
    <section className="bg-white px-4 py-12 md:py-16 border-t border-gray-100">
      <div className="max-w-[860px] mx-auto">
        <FadeIn>
          <h2 className="text-center text-2xl md:text-[26px] font-black text-gray-950 tracking-tight mb-9">
            <span className="text-blue-600">JaoRium</span>を使えば解決できます！
          </h2>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_36px_1fr_36px_1fr] items-stretch gap-2 md:gap-0">
          {cols}
        </div>
      </div>
    </section>
  );
}

/* ── §4 使い方 ＋ CTA ── */
function ExampleSection() {
  return (
    <section className="bg-blue-50 px-4 py-12">
      <div className="max-w-[1000px] mx-auto">
        <FadeIn>
          <div className="relative w-full rounded-xl overflow-hidden mb-7">
            <Image
              src="/imgExample.png"
              alt="たとえばこんな使い方"
              width={2172}
              height={724}
              className="rounded-t-xl w-full object-cover"
            />
          </div>
        </FadeIn>
        <FadeIn delay={80}>
          <div className="bg-white rounded-xl border border-gray-200 p-5 md:px-7 md:py-5 flex flex-col sm:flex-row items-center justify-between gap-5">
            <p className="text-[14px] font-bold text-gray-950 text-center sm:text-left">
              あなたの受験を、リアルな情報でサポートします。
            </p>
            <Link
              href="signup/user"
              className="inline-flex items-center gap-2 bg-amber-500 text-white text-[14px] font-bold py-[13px] px-7 rounded-full no-underline whitespace-nowrap shadow-[0_3px_12px_rgba(245,158,11,0.35)] hover:bg-amber-600 transition-colors"
            >
              今すぐ先輩を探してみる
              <svg
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 stroke-white fill-none stroke-[2.5]"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── メインエクスポート ── */
export default function JaoRiumSection() {
  return (
    <div className="mt-10 bg-white text-gray-950 antialiased">
      <HeroSection />
      <WorriesSection />
      <SolutionSection />
      <ExampleSection />
    </div>
  );
}