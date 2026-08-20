"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "勉強を教えてもらう場所ですか？",
    a: "いいえ。指導ではなく、実際に合格した先輩に受験のことを聞く場です。",
  },
  { q: "話すことがなくても大丈夫ですか？",
    a: "はい。面談では、先輩が質問を引き出すように進めてくれるので、話すことがなくても大丈夫です。",
   },
  { q: "カメラはオフでもいいですか？", a: "はい。カメラをオフにすることも可能です。" },
  { q: "支払いはどうすればいいですか？", a: "支払いは、クレジットカードで行います。" },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-white py-14 lg:py-24 px-6">
      <div className="max-w-350 mx-auto lg:grid lg:grid-cols-[360px_1fr] lg:gap-14 lg:items-center">
        <div className="mb-6 lg:mb-0">
          <h2 className="text-2xl lg:text-4xl font-bold text-slate-900 mb-3 lg:mb-4.5">
            よくある質問
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            JaoRiumを安心してご利用いただけるよう、
            <br className="hidden lg:block" />
            よくいただくご質問をまとめました。
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.q}
                className={`rounded-xl p-4.5 lg:p-6.5 cursor-pointer transition-colors ${
                  isOpen
                    ? "bg-blue-50/60 border border-blue-100"
                    : "bg-white border border-slate-100"
                }`}
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
              >
                <div className="flex gap-3.5 lg:gap-5 items-center">
                  <div className="flex-none w-8 h-8 lg:w-9.5 lg:h-9.5 rounded-full bg-blue-50 flex items-center justify-center">
                    {isOpen ? (
                      <Minus className="w-4 h-4 lg:w-4.5 lg:h-4.5 text-blue-600" />
                    ) : (
                      <Plus className="w-4 h-4 lg:w-4.5 lg:h-4.5 text-blue-600" />
                    )}
                  </div>
                  <p className="font-bold text-base lg:text-lg text-slate-900">
                    {item.q}
                  </p>
                </div>
                {isOpen && item.a && (
                  <p className="ml-11.5 lg:ml-14.5 mt-2.5 lg:mt-3.5 text-base text-slate-600 leading-loose">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
