import Image from "next/image";
import {
  ExternalLink,
  JapaneseYen,
  Calendar,
  CircleCheck,
} from "lucide-react";
import SlidePreview from "./SlidePreviewClient";

const R2_LP_URL = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/LP`;

export default function FeaturesSection() {
  return (
    <section className="bg-slate-50 py-14 lg:py-24 px-6">
      <div className="max-w-350 mx-auto">
        <h2 className="text-center text-2xl lg:text-5xl font-bold text-slate-900 mb-3 lg:mb-4">
          JaoRium の特長
        </h2>
        <p className="text-center text-base text-slate-600 mb-7 lg:mb-12 leading-relaxed">
          志望校の先輩だからこそ話せる、
          <br className="lg:hidden" />
          リアルで価値ある情報をお届けします。
        </p>

        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-7">
          <div className="bg-white rounded-2xl p-5.5 lg:p-8.5 shadow-[0_2px_14px_rgba(31,35,40,.06)] flex flex-col lg:grid lg:grid-cols-[1fr_0.9fr] lg:gap-6 lg:items-center">
            <div>
              <p className="text-lg font-bold text-blue-600 mb-3.5">01</p>
              <p className="text-lg lg:text-2xl font-bold text-slate-900 leading-snug">
                志望校の先輩に、
                <br />
                直接相談できる
              </p>
            </div>
            <div className="relative h-[25vh] lg:h-full lg:row-span-2 rounded-xl overflow-hidden my-4 lg:my-0">
              <Image
                src={`${R2_LP_URL}/charactar/1.webp`}
                alt=""
                fill
                className="object-cover"
              />
            </div>
            <p className="text-base text-slate-600 leading-loose">
              ネットには出てこない一次情報を、合格した本人から。学部の実態、併願、勉強の進め方まで。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5.5 lg:p-8.5 shadow-[0_2px_14px_rgba(31,35,40,.06)] flex flex-col lg:grid lg:grid-cols-[1fr_0.9fr] lg:gap-6 lg:items-center">
            <div>
              <p className="text-lg font-bold text-blue-600 mb-3.5">02</p>
              <p className="text-lg lg:text-2xl font-bold text-slate-900 leading-snug">
                45分の面談＋個別作成の
                <br />
                オリジナル解説スライド
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4.5 my-4 lg:my-0 lg:row-span-2">
              <p className="text-center font-bold text-slate-900 mb-3.5">
                JaoRium メンター面談
              </p>
              <SlidePreview fileUrl="/templateSlide.pdf" />
              <div className="flex justify-end mt-3.5">
                <a
                  href="/templateSlide.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors"
                >
                  スライド全体を確認 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div>
              <p className="text-base text-slate-600 leading-loose">
                あなたの質問に合わせて、一つの面談に対してオリジナルのスライドをご用意します。面談後もスライドを見返せるため、聞いて終わりにしない。
              </p>
              {/* <p className="mt-2.5 text-xs text-slate-400">
                ※プランによってはもらえない場合も
              </p> */}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5.5 lg:p-8.5 shadow-[0_2px_14px_rgba(31,35,40,.06)] flex flex-col lg:grid lg:grid-cols-[1fr_0.9fr] lg:gap-6 lg:items-center">
            <div>
              <p className="text-lg font-bold text-blue-600 mb-3.5">03</p>
              <p className="text-lg lg:text-2xl font-bold text-slate-900 leading-snug">
                距離や時期に関係なく、
                <br />
                志望校の先輩に聞ける
              </p>
            </div>
            <div className="relative h-[25vh] lg:h-full lg:row-span-2 rounded-xl overflow-hidden my-4 lg:my-0">
              <Image
                src={`${R2_LP_URL}/charactar/2.webp`}
                alt=""
                fill
                className="object-cover"
              />
            </div>
            <p className="text-base text-slate-600 leading-loose">
              地方在住でも、オープンキャンパスの時期じゃなくても志望する大学・学部の先輩にオンラインで相談可能。今聞きたい疑問を、その場で解決できます。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5.5 lg:p-8.5 shadow-[0_2px_14px_rgba(31,35,40,.06)] flex flex-col lg:grid lg:grid-cols-[1fr_0.9fr] lg:gap-6 lg:items-center">
            <div>
              <p className="text-lg font-bold text-blue-600 mb-3.5">04</p>
              <p className="text-lg lg:text-2xl font-bold text-slate-900 mb-3.5 leading-snug">
                入会費不要。
                <br />
                聞きたいときだけ使える
              </p>
              <p className="text-base text-slate-600 leading-loose">
                塾のような月額や入会金に縛られず、必要なタイミングだけ1回から利用可能。気軽に一次情報を取りにいけます。
              </p>
            </div>
            <div>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 rounded-xl px-2 py-3.5 text-center">
                  <JapaneseYen className="w-5.5 h-5.5 text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-600 my-2">入会費</p>
                  <p className="font-bold text-lg text-blue-600">¥0</p>
                </div>
                <div className="flex-1 bg-slate-50 rounded-xl px-2 py-3.5 text-center">
                  <Calendar className="w-5.5 h-5.5 text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-600 my-2">月額不要</p>
                  <p className="font-bold text-lg text-blue-600">¥0</p>
                </div>
                <div className="flex-1 bg-slate-50 rounded-xl px-2 py-3.5 text-center">
                  <CircleCheck className="w-5.5 h-5.5 text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-600 my-2">必要なときだけ</p>
                  <p className="font-bold text-base text-blue-600 leading-snug">
                    1回から
                    <br />
                    利用可能
                  </p>
                </div>
              </div>
              <p className="mt-3.5 text-center text-xs font-medium text-blue-600 leading-relaxed">
                塾のような縛りなく、
                <br />
                必要なときだけ気軽に相談できます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
