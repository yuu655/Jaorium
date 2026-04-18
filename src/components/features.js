import Image from "next/image";

export default function Features() {
  return (
    <>
      <section className="bg-slate-50 py-24 md:py-32 overflow-hidden relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 md:mb-24 relative z-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-800">
              JaoRiumの
              <span className="text-6xl md:text-8xl mx-2 font-black italic text-blue-600 drop-shadow-sm">
                4
              </span>
              つの特長
            </h2>
          </div>

          <div className="space-y-32 md:space-y-24 mt-20">
            <div className="relative flex flex-col md:flex-row items-center bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 max-w-4xl mx-auto w-full md:w-[85%] md:mr-auto md:ml-0 border border-slate-100">
              <div
                className="absolute -top-12 md:-top-16 -left-4 md:-left-12 text-[100px] md:text-[140px] font-black italic leading-none z-20 text-blue-500"
                style={{ textShadow: "0 10px 20px rgba(0,0,0,0.05)" }}
              >
                01
              </div>
              <div className="w-full md:w-1/2 z-10 flex flex-col justify-center mt-28 md:mt-0 md:pl-20 md:pr-4">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-tight text-slate-800">
                  志望校の先輩に
                  <br />
                  直接相談できる！
                </h3>
                <p className="leading-relaxed text-sm md:text-base text-slate-600">
                  大学のリアルな情報や、合格までの具体的な体験談など、ネットにはない生の情報を専属メンターから直接聞くことができます。志望校の先輩だからこそわかる悩みを解決しましょう。
                </p>
              </div>
              <div className="w-full md:w-1/2 mt-10 md:mt-0 flex justify-center z-10">
                <div className="relative w-full max-w-md mx-auto">
                  <div className="absolute -top-6 -left-6 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-60"></div>
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-2xl opacity-60"></div>

                  <div className="relative bg-white p-2.5 rounded-[2.5rem] shadow-2xl border border-slate-100 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                    <div className="overflow-hidden rounded-[2rem] aspect-4/3">
                      <Image
                        width={100}
                        height={100}
                        src="messageImage_1776409064930.jpg"
                        alt=""
                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col md:flex-row items-center bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 max-w-4xl mx-auto w-full md:w-[85%] md:ml-auto md:mr-0 border border-slate-100">
              <div
                className="absolute -top-12 md:-top-16 -right-4 md:-right-12 text-[100px] md:text-[140px] font-black italic leading-none z-20 text-blue-500"
                style={{ textShadow: "0 10px 20px rgba(0,0,0,0.05)" }}
              >
                02
              </div>
              <div className="w-full md:w-1/2 z-10 flex flex-col justify-center mt-28 md:mt-0 md:pr-20 md:pl-4 order-1 md:order-2">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-tight text-slate-800">
                  入会金・初期費用<span className="text-red-500">ゼロ</span>
                  で気軽に始められる！
                </h3>
                <p className="leading-relaxed text-sm md:text-base text-slate-600">
                  学習塾や予備校でかかる高額な入会金や教材費は一切不要です。スマートフォンやPCから、手軽に優秀なメンターにアクセスできます。より良いサービス改善のための実証実験として、今だけ初回相談を完全に無料で提供しています。この機会に、憧れの大学の先輩から本音のアドバイスを聞いてみませんか？
                </p>
              </div>
              <div className="w-full md:w-1/2 mt-10 md:mt-0 flex justify-center z-10 order-2 md:order-1">
                <div className="w-full max-w-md mx-auto aspect-square md:aspect-auto md:h-[400px] bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-[2.5rem] border-8 border-white shadow-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute -bottom-10 -left-10 text-blue-100/50">
                    <i data-lucide="shield-check" className="w-64 h-64"></i>
                  </div>

                  <div className="relative z-10 text-center w-full px-6 flex flex-col justify-center h-full">
                    <div className="bg-white/90 backdrop-blur px-4 py-3 rounded-2xl shadow-sm border border-blue-100 flex justify-center gap-4 text-sm font-bold w-full max-w-[90%] mx-auto mb-6">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-slate-500 text-[10px]">
                          入会金
                        </span>
                        <span className="text-slate-800 text-base leading-none">
                          ¥0
                        </span>
                      </div>
                      <div className="w-px h-8 bg-slate-200"></div>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-slate-500 text-[10px]">
                          教材費
                        </span>
                        <span className="text-slate-800 text-base leading-none">
                          ¥0
                        </span>
                      </div>
                      <div className="w-px h-8 bg-slate-200"></div>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-slate-500 text-[10px]">
                          解約金
                        </span>
                        <span className="text-slate-800 text-base leading-none">
                          ¥0
                        </span>
                      </div>
                    </div>

                    <div className="w-full px-1">
                      <div className="relative bg-slate-800 text-white rounded-2xl p-4 shadow-xl border border-slate-700 transform hover:scale-105 transition-transform duration-300 text-center mx-auto w-full">
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-400 text-amber-900 text-[11px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                          実証実験キャンペーン
                        </div>

                        <div className="flex justify-center mb-2 mt-2">
                          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600 shadow-inner">
                            <i
                              data-lucide="gift"
                              className="w-5 h-5 text-amber-400 drop-shadow-sm"
                            ></i>
                          </div>
                        </div>

                        <h4 className="text-[10px] font-bold mb-0.5 text-slate-300 tracking-widest">
                          今だけ！
                        </h4>
                        <div className="text-xl font-black tracking-tight text-white whitespace-nowrap">
                          初回相談料無料
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col md:flex-row items-center bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 max-w-4xl mx-auto w-full md:w-[85%] md:mr-auto md:ml-0 border border-slate-100">
              <div
                className="absolute -top-12 md:-top-16 -left-4 md:-left-12 text-[100px] md:text-[140px] font-black italic leading-none z-20 text-blue-500"
                style={{ textShadow: "0 10px 20px rgba(0,0,0,0.05)" }}
              >
                03
              </div>
              <div className="w-full md:w-1/2 z-10 flex flex-col justify-center mt-28 md:mt-0 md:pl-20 md:pr-4">
                <h3 className="mb-5 leading-tight">
                  <span className="block text-lg md:text-xl font-bold text-slate-700">
                    40分の面談で
                  </span>
                  <span className="block text-lg md:text-xl font-bold text-slate-700">
                    ネットにはない
                  </span>
                  <span className="block text-xl sm:text-2xl md:text-3xl font-black text-red-500 mt-2 mb-1 whitespace-nowrap">
                    リアルな情報を
                  </span>
                  <span className="block text-lg md:text-xl font-bold text-slate-700">
                    得られる！
                  </span>
                </h3>
                <p className="leading-relaxed text-sm md:text-base text-slate-600">
                  一人一人個別に作成したスライドを用い、受験のリアル、面談で何を聞かれたか、実際に入学してみて分かったキャンパスライフのリアルなど、ネット検索では見つからない生の情報を直接聞くことができます。1回40分の面談で、受験という情報戦を勝ち抜く力を手に入れましょう！
                </p>
              </div>
              <div className="w-full md:w-1/2 mt-10 md:mt-0 flex justify-center z-10">
                <div className="w-full max-w-md mx-auto aspect-square md:aspect-auto md:h-[400px] bg-blue-50/80 rounded-[2.5rem] shadow-[inset_0_4px_20px_rgba(0,0,0,0.03)] border border-blue-100/50 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 text-blue-200/30">
                    <i data-lucide="monitor-play" className="w-64 h-64"></i>
                  </div>

                  <div className="relative z-10 w-full px-6 flex flex-col items-center">
                    <div className="bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 w-full max-w-[280px] relative z-20 mb-[-15px] group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgb(0,0,0,0.12)]">
                      <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-400 to-rose-400 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md z-30">
                        JaoRium限定
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                          <i
                            data-lucide="presentation"
                            className="w-4 h-4 text-blue-500"
                          ></i>
                        </div>
                        <div className="font-bold text-slate-800 text-sm">
                          オリジナル解説スライド
                        </div>
                      </div>

                      <div className="relative w-full aspect-video bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                        <div className="absolute inset-0 p-3 flex flex-col justify-between opacity-70">
                          <div>
                            <div className="h-2 w-1/2 bg-blue-200 rounded mb-2"></div>
                            <div className="h-1.5 w-full bg-slate-200 rounded mb-1"></div>
                            <div className="h-1.5 w-5/6 bg-slate-200 rounded"></div>
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="w-8 h-8 rounded bg-slate-200"></div>
                            <div className="flex-1 space-y-1">
                              <div className="h-1 w-full bg-slate-200 rounded"></div>
                              <div className="h-1 w-2/3 bg-slate-200 rounded"></div>
                            </div>
                          </div>
                        </div>

                        <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-slate-900/30 transition-colors duration-300 flex items-center justify-center">
                          <div className="bg-white/95 backdrop-blur-sm text-blue-600 font-bold text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 transform scale-95 group-hover:scale-100 transition-all duration-300">
                            <i
                              data-lucide="play"
                              className="w-3 h-3 fill-current"
                            ></i>
                            実際に見てみる
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-100 w-full max-w-[260px] transform rotate-2 relative z-10 ml-8 opacity-95">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-yellow-50 flex items-center justify-center">
                          <i
                            data-lucide="lightbulb"
                            className="w-3 h-3 text-yellow-500"
                          ></i>
                        </div>
                        <div className="font-bold text-slate-700 text-xs">
                          ネットにない一次情報
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded w-full mb-1"></div>
                      <div className="h-1.5 bg-slate-100 rounded w-3/4 mb-1"></div>
                      <div className="h-1.5 bg-slate-100 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col md:flex-row items-center bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 max-w-4xl mxauto w-full md:w-[85%] md:ml-auto md:mr-0 border border-slate-100">
              <div
                className="absolute -top-12 md:-top-16 -right-4 md:-right-12 text-[100px] md:text-[140px] font-black italic leading-none z-20 text-blue-500"
                style={{ textShadow: "0 10px 20px rgba(0,0,0,0.05)" }}
              >
                04
              </div>
              <div className="w-full md:w-1/2 z-10 flex flex-col justify-center mt-28 md:mt-0 md:pr-20 md:pl-4 order-1 md:order-2">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-tight text-slate-800">
                  <span className="inline-block">
                    <span className="text-red-500">3つ</span>の入試方式に対応！
                  </span>
                  <br />
                  <span className="inline-block whitespace-nowrap">
                    あなたに合った
                  </span>
                  <br />
                  <span className="inline-block whitespace-nowrap">
                    先輩が見つかる
                  </span>
                </h3>
                <p className="leading-relaxed text-sm md:text-base text-slate-600">
                  JaoRiumでは、一般入試だけでなく、推薦・総合型選抜、帰国子女枠など、様々な入試方式で合格した先輩が多数在籍しています。あなたが志望する大学・学部、そして同じ入試方式を経験した先輩から、的確で実践的なアドバイスをもらうことができます。
                </p>
              </div>
              <div className="w-full md:w-1/2 mt-10 md:mt-0 flex justify-center z-10 order-2 md:order-1">
                <div className="w-full max-w-md mx-auto md:aspect-auto h-[400px] bg-linear-to-br from-emerald-50 to-teal-100 rounded-[2.5rem] border-8 border-white shadow-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute -bottom-10 -right-10 text-emerald-200/50">
                    <i data-lucide="check-square" className="w-64 h-64"></i>
                  </div>

                  <div className="relative z-10 w-full px-6 flex flex-col gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4 transform transition-transform hover:-translate-y-1 hover:shadow-md">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold shrink-0">
                        <i data-lucide="book-open" className="w-6 h-6"></i>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-800 text-sm">
                          一般入試
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          共通テスト・二次試験の対策に
                        </div>
                      </div>
                      <i
                        data-lucide="check-circle-2"
                        className="w-5 h-5 text-emerald-500 shrink-0"
                      ></i>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4 transform transition-transform hover:-translate-y-1 hover:shadow-md ml-6">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 font-bold flex-shrink-0">
                        <i data-lucide="award" className="w-6 h-6"></i>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-800 text-sm">
                          推薦・総合型選抜
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          志望理由書や面接の対策に
                        </div>
                      </div>
                      <i
                        data-lucide="check-circle-2"
                        className="w-5 h-5 text-emerald-500 shrink-0"
                      ></i>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4 transform transition-transform hover:-translate-y-1 hover:shadow-md">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-bold flex-shrink-0">
                        <i data-lucide="globe" className="w-6 h-6"></i>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-800 text-sm">
                          帰国子女・IB入試
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          海外経験のアピール方法などに
                        </div>
                      </div>
                      <i
                        data-lucide="check-circle-2"
                        className="w-5 h-5 text-emerald-500 shrink-0"
                      ></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
