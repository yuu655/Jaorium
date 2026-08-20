import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FinalCtaSection() {
  return (
    <section className="relative bg-blue-50 py-16 lg:py-28 px-6 text-center overflow-hidden">
      <div className="absolute -left-27.5 -bottom-30 w-70 h-70 lg:w-105 lg:h-105 rounded-full bg-blue-100" />
      <div className="absolute -right-20 -top-22.5 w-50 h-50 lg:w-75 lg:h-75 rounded-full bg-blue-100" />

      <div className="relative">
        <h2 className="text-2xl lg:text-5xl font-bold text-slate-900 mb-3.5 lg:mb-5 leading-snug">
          まずは1回、
          <br className="lg:hidden" />
          無料で話してみる
        </h2>
        <p className="text-base text-slate-600 mb-6.5 lg:mb-9">
          登録は1分。入会金・解約金はありません。
        </p>
        <div className="flex justify-center">
          <Button
            asChild
            size="lg"
            className="w-full max-w-xs lg:w-auto h-auto rounded-lg bg-blue-700 px-10 lg:px-12 py-4.75 lg:py-6 text-base lg:text-lg font-bold hover:bg-blue-800"
          >
            <Link href="/mentors" className="flex items-center gap-3">
              無料でメンターを探す <ChevronRight className="w-4.5 h-4.5 lg:w-5 lg:h-5" />
            </Link>
          </Button>
        </div>
        <Link
          href="/articles/1"
          className="mt-5 lg:mt-7 inline-flex items-center gap-1.5 text-base font-medium text-slate-700"
        >
          <span className="underline underline-offset-4">受験のヒント記事を読む</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        </Link>
      </div>
    </section>
  );
}
