import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Concept() {
  return (
    // <div className="bg-slate-200">
    //   <div className="max-w-300 mx-auto px-4">
    //     <div className="md:flex md:items-end md:justify-center py-30 gap-20">
    //       <div>
    //         <h2 className="md:text-4xl text-3xl font-sans pb-13">
    //           経済格差が、情報の格差になってはいけない。
    //         </h2>
    //         <p className="md:text-3xl text-2xl font-thin font-sans">
    //           受験のノウハウなど、
    //           <br />
    //           お金を払ってしか得られないものも多い。
    //         </p>
    //         <p className="md:text-3xl text-2xl font-thin font-sans">
    //           ネットにある無料情報は、上辺だけの話も多い。
    //         </p>
    //         <p className="md:text-3xl text-2xl font-thin font-sans">
    //           だからじゃおりうむは、
    //         </p>
    //         <h2 className="md:text-3xl text-2xl font-thin font-sans">
    //           リアルな一次情報をあなたに届ける
    //         </h2>
    //       </div>

    //       <Button variant="noBG" size="noBG" className="pt-20 md:pt-0" asChild>
    //         <Link className="text-[25px] font-thin" href="/concept">コンセプト</Link>
    //       </Button>
    //     </div>
    //   </div>
    // </div>
    <div className="min-h-screen bg-[#EAEFF4] text-gray-800 font-sans selection:bg-blue-200 selection:text-blue-900 overflow-x-hidden">

      {/* コンセプト メインメッセージ (スクリーンショット準拠) */}
      <section className="pt-32 pb-16 px-8 max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end">
          <div className="space-y-8 w-full">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-snug border-b-2 border-gray-900 pb-4 inline-block">
              受験は、「<span className="text-red-600">知っているか</span>」どうかで決まる。
            </h2>
            <div className="space-y-4 pt-4 text-lg md:text-xl text-gray-800 leading-loose">
              <p className="border-b border-gray-300 pb-2">受験のノウハウなどお金を払ってしか得られなかった。</p>
              <p className="border-b border-gray-300 pb-2">ネットにある無料情報は、上辺だけの話も多い。</p>
              <p className="border-b border-gray-300 pb-2">だからじゃおりうむは、リアルな一次情報をあなたに届ける。</p>
            </div>
          </div>
      </section>

      {/* 課題と解決の「対比」カードUI (上下レイアウト) */}
      <section className="py-12 px-6 max-w-4xl mx-auto relative z-10">
        <div className="flex flex-col gap-10 mb-20">
          
          {/* 上カード (現状の壁) */}
            <div className="bg-[#E9ECEF] rounded-[3rem] p-10 md:p-14 w-full flex flex-col justify-center transition-transform hover:-translate-y-1 duration-300">
              <div className="mb-8 flex items-center text-gray-600 font-bold text-xl md:text-2xl border-b border-gray-300 pb-4">
                <span className="flex items-center justify-center w-12 h-12 bg-gray-300/80 rounded-full mr-4 text-2xl">🤔</span>
                現状の壁
              </div>
              <ul className="space-y-6 px-4 md:px-8">
                <li className="flex items-start">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold mt-1 mr-6 text-lg">×</div>
                  <span className="text-gray-700 font-medium leading-relaxed text-lg md:text-xl">
                    高額な予備校でしか得られないクローズドなノウハウ
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold mt-1 mr-6 text-lg">×</div>
                  <span className="text-gray-700 font-medium leading-relaxed text-lg md:text-xl">
                    ネットに溢れる、誰が書いたか分からない表面的な無料記事
                  </span>
                </li>
              </ul>
            </div>

          {/* 下カード (私たちのこたえ) */}
            <div className="bg-white rounded-[3rem] p-10 md:p-14 w-full shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] relative border border-blue-50 flex flex-col justify-center transition-transform hover:-translate-y-1 duration-300">
              <div className="mb-8 flex items-center text-blue-600 font-bold text-xl md:text-2xl border-b border-blue-100 pb-4">
                <span className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mr-4 text-2xl">💡</span>
                私たちのこたえ
              </div>
              
              <div className="px-4 md:px-8">
                <p className="text-gray-800 leading-relaxed text-lg md:text-xl">
                  だから、JaoRiumは<br className="hidden md:block"/>
                  <span className="text-blue-600 font-bold text-2xl md:text-3xl inline-block mt-3 mb-4 border-b-4 border-blue-200 pb-1">
                    『リアルな情報』を直接届ける。
                  </span>
                  <br />
                  受験情報や大学生活を<span className="text-blue-600 font-bold">「知りたいとき」</span>に、<span className="text-blue-600 font-bold">「聞きたい」</span>大学学部の先輩に<span className="text-red-600 font-bold">直接</span>聞けるプラットフォームを作りました。
                </p>
              </div>
            </div>

        </div>
      </section>
    </div>
  );
}
