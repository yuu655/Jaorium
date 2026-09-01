"use client";

import { useState } from "react";

const faqs = [
  {
    q: "教えるのが得意じゃなくても大丈夫ですか？",
    a: "運営が作成したスライドに沿って話すため、教える技術は必要ありません。自分の受験を振り返って話せれば十分です。",
  },
  {
    q: "どのくらいの頻度で面談がありますか？",
    a: "決まった回数やノルマはありません。高校生から指名が入ったときだけ面談を行うスポット型です。",
  },
  {
    q: "テスト期間や就活で休めますか？",
    a: "はい。固定シフトはないため、都合の合わない期間はお休みいただけます。落ち着いたタイミングで再開できます。",
  },
  {
    q: "辞めたいときはどうすればいいですか？",
    a: "いつでも辞めていただけます。マイページから退会するか、運営までご連絡ください。",
  },
  {
    q: "報酬はいつ振り込まれますか？",
    a: "面談完了分の報酬が積み上がり、ご登録の口座へお振り込みします。詳細は登録後にご案内します。",
  },
  {
    q: "高校生と個人的な連絡先を交換することはありますか？",
    a: "ありません。やり取りも面談もすべてJaoRium上で完結するため、個人の連絡先を伝える必要はありません。",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="mx-auto max-w-375 px-5.5 pt-9 pb-8.5 lg:px-14 lg:pt-21 lg:pb-22.5">
      <h2 className="mb-5.5 text-center text-[23px] leading-[1.5] font-bold text-[#1F2328] lg:mb-13 lg:text-[39px] lg:leading-[1.45] lg:tracking-tight">
        よくある質問
      </h2>

      <div className="mx-auto flex max-w-225 flex-col gap-2.5 lg:gap-3">
        {faqs.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={item.q}
              className="overflow-hidden rounded-[10px] border border-[#E4E7EB] lg:rounded-xl"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full cursor-pointer items-center justify-between gap-2.5 p-3.75 text-left lg:gap-4 lg:px-6.5 lg:py-5.5"
              >
                <span className="text-[14px] leading-relaxed font-bold text-[#1F2328] lg:text-lg">
                  {item.q}
                </span>
                <span
                  aria-hidden
                  className={`text-[15px] lg:text-xl ${
                    isOpen ? "text-blue-600" : "text-[#98A0AA]"
                  }`}
                >
                  {isOpen ? "−" : "＋"}
                </span>
              </button>
              {isOpen && (
                <p className="px-3.75 pb-3.75 text-[13.5px] leading-[1.85] text-[#5A626C] lg:px-6.5 lg:pb-5.5 lg:text-[15px]">
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
