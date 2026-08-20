import Image from "next/image";
import {
  Mail,
  Search,
  ChevronRight,
  Calendar,
  Send,
  Plus,
  ArrowDown,
  ArrowRight,
  Laptop,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

const R2_LP_URL = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/LP`;

const searchResults = [
  { univ: "東京大学 文科一類 2年", name: "田中 健太", tags: ["一般入試", "文系"] },
  { univ: "早稲田大学 教育学部 3年", name: "佐藤 美咲", tags: ["総合型選抜", "文系"] },
  { univ: "慶應義塾大学 経済学部 2年", name: "鈴木 健太", tags: ["一般入試", "文系"] },
];

const perks = [
  { icon: Laptop, title: "オンラインで完結", body: "自宅から気軽に参加できます" },
  { icon: ShieldCheck, title: "メンターは審査済み", body: "厳しい基準をクリアした先輩のみ" },
  { icon: Users, title: "保護者の同席も可", body: "安心してご利用いただけます" },
];

function StepShell({ n, title, children }) {
  return (
    <div className="flex-1 min-w-0 bg-white rounded-2xl p-5 lg:p-6.5 shadow-[0_2px_14px_rgba(31,35,40,.06)] flex flex-col">
      <span className="self-start bg-blue-600 text-white rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wide mb-5.5">
        STEP {n}
      </span>
      <div className="flex-1 flex flex-col">{children}</div>
      <div className="mt-5.5 text-center">
        <p className="font-bold text-lg text-slate-900 mb-2.5">{title}</p>
      </div>
    </div>
  );
}

export default function HowToStartSection() {
  return (
    <section className="bg-slate-50 py-14 lg:py-24 px-6">
      <div className="max-w-350 mx-auto">
        <h2 className="text-center text-2xl lg:text-5xl font-bold text-slate-900 mb-3 lg:mb-4">
          はじめ方
        </h2>
        <p className="text-center text-base text-slate-600 mb-7 lg:mb-12">
          登録から面談まで、かんたん4ステップ。
        </p>

        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-stretch lg:gap-4">
          <StepShell n={1} title="無料で登録">
            <div className="flex-1 flex flex-col justify-center">
              <div className="border border-slate-200 rounded-lg py-3.5 flex items-center justify-center gap-2.5 text-base font-medium text-slate-700">
                <span className="font-bold text-blue-500">G</span>
                Googleでサインアップ
              </div>
              <div className="flex items-center gap-2.5 my-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">または</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <p className="text-xs font-medium text-slate-600 mb-2">メールアドレス</p>
              <div className="border border-slate-200 rounded-lg py-3.5 px-3 flex items-center gap-2 text-xs text-slate-400">
                <Mail className="w-4 h-4" />
                example@email.com
              </div>
              <div className="bg-blue-600 text-white rounded-lg py-3.5 text-center text-base font-bold mt-5">
                サインアップ
              </div>
            </div>
            <p className="text-base text-slate-600 leading-relaxed">
              簡単な情報を入力。1分ほどでアカウントを作成できます。
            </p>
          </StepShell>

          <div className="flex lg:flex-col items-center justify-center py-1 lg:py-0">
            <ArrowDown className="w-6 h-6 text-blue-600 lg:hidden" />
            <div className="hidden lg:flex w-8.5 h-8.5 rounded-full bg-blue-50 items-center justify-center">
              <ArrowRight className="w-4.5 h-4.5 text-blue-600" />
            </div>
          </div>

          <StepShell n={2} title="メンターを探す">
            <div className="flex-1 bg-slate-50 rounded-xl p-3.5 flex flex-col gap-2.5">
              <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 flex items-center justify-between text-xs text-slate-400">
                大学名・学部・入試方式で検索
                <Search className="w-3.5 h-3.5 text-slate-400" />
              </div>
              {searchResults.map(({ univ, name, tags }) => (
                <div
                  key={name}
                  className="bg-white rounded-lg px-3 py-3 flex gap-2.5 items-center shadow-sm"
                >
                  <div className="flex-none w-11 h-11 rounded-full bg-slate-200" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 truncate">{univ}</p>
                    <p className="text-base font-bold text-slate-900 truncate">{name}</p>
                    <div className="flex gap-1.25 mt-1">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="bg-blue-50 rounded px-1.75 py-0.5 text-[9px] text-blue-600"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                </div>
              ))}
            </div>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              志望大学・学部・入試方式から、自分に合う先輩を見つけます。
            </p>
          </StepShell>

          <div className="flex lg:flex-col items-center justify-center py-1 lg:py-0">
            <ArrowDown className="w-6 h-6 text-blue-600 lg:hidden" />
            <div className="hidden lg:flex w-8.5 h-8.5 rounded-full bg-blue-50 items-center justify-center">
              <ArrowRight className="w-4.5 h-4.5 text-blue-600" />
            </div>
          </div>

          <StepShell n={3} title="チャットで予約">
            <div className="flex-1 bg-slate-50 rounded-xl p-3.5 flex flex-col gap-3">
              <div className="flex gap-2 items-end">
                <div className="flex-none w-6.5 h-6.5 rounded-full bg-slate-200" />
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm max-w-[78%]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Calendar className="w-2.75 h-2.75 text-blue-600" />
                    <span className="text-[10px] font-medium text-blue-600">田中 健太</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 mb-2 leading-snug">
                    2026年8月19日（火）
                    <br />
                    19:00
                  </p>
                  <div className="bg-green-600 text-white rounded px-2 py-1.5 text-center text-[10px] font-medium">
                    この日時で予約する
                  </div>
                </div>
              </div>
              <div className="self-end max-w-[76%] bg-blue-600 text-white rounded-lg rounded-br-sm px-3 py-2 text-xs">
                その日程で大丈夫です！
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-none w-6.5 h-6.5 rounded-full bg-slate-200" />
                <div className="bg-white rounded-lg rounded-bl-sm px-3 py-2 text-xs text-slate-900 shadow-sm">
                  承知しました。では当日はよろしくお願いします。
                </div>
              </div>
              <div className="mt-auto flex items-center gap-2">
                <Plus className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 bg-white border border-blue-200 rounded-full px-3 py-2 text-[10px] text-slate-400">
                  メッセージを入力…
                </div>
                <div className="flex-none w-6.5 h-6.5 rounded-full bg-blue-50 flex items-center justify-center">
                  <Send className="w-3.25 h-3.25 text-blue-600" />
                </div>
              </div>
            </div>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              気になる先輩と日程を相談して、面談日を決めます。
            </p>
          </StepShell>

          <div className="flex lg:flex-col items-center justify-center py-1 lg:py-0">
            <ArrowDown className="w-6 h-6 text-blue-600 lg:hidden" />
            <div className="hidden lg:flex w-8.5 h-8.5 rounded-full bg-blue-50 items-center justify-center">
              <ArrowRight className="w-4.5 h-4.5 text-blue-600" />
            </div>
          </div>

          <StepShell n={4} title="オンライン面談">
            <div className="relative flex-1 min-h-60 rounded-xl overflow-hidden">
              <Image
                src={`${R2_LP_URL}/start/1.webp`}
                alt=""
                fill
                className="object-cover"
              />
            </div>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              45分の面談で、聞きたいことを直接相談できます。
            </p>
          </StepShell>
        </div>

        <div className="mt-8.5 lg:mt-14 pt-6.5 lg:pt-10 border-t border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4.5 lg:gap-10">
          {perks.map(({ icon: PerkIcon, title, body }) => (
            <div key={title} className="flex items-center gap-4">
              <div className="flex-none w-13 h-13 rounded-full bg-blue-50 flex items-center justify-center">
                <PerkIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{title}</p>
                <p className="text-base text-slate-600">{body}</p>
              </div>
            </div>
          ))}
          <Link href="/concept" className="text-base font-medium text-blue-600 lg:shrink-0">
            保護者の方へ　→
          </Link>
        </div>
      </div>
    </section>
  );
}
