import { ChevronRight, Search, User, Star, ArrowLeft, Calendar, Send, MessageCircle, Video } from 'lucide-react';
import Link from 'next/link';

export default function HowWork() {
  const textShadow = {
    text_shadow: "0 10px 20px rgba(0,0,0,0.05)"
  }
  return (
    <>
      <section className="bg-blue-400 py-24 md:py-32 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-white blur-3xl"></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-400 blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">

          {/* */}
          <div className="text-center mb-16 md:mb-24 relative z-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="block w-8 h-px transform rotate-45 translate-y-1 bg-white/50"></span>
              <span className="font-bold tracking-widest text-sm md:text-base text-white">スマホで簡単！</span>
              <span className="block w-8 h-px transform -rotate-45 translate-y-1 bg-white/50"></span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              はじめるまでの
              <span className="text-6xl md:text-8xl mx-2 font-black italic text-yellow-400 drop-shadow-md">4</span>
              ステップ
            </h2>
          </div>

          <div className="space-y-32 md:space-y-24 mt-20">

            {/* */}
            <div className="relative flex flex-col md:flex-row items-center bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 max-w-4xl mx-auto w-full md:w-[85%] md:mr-auto md:ml-0">
              <div className="absolute -top-12 md:-top-16 -left-4 md:-left-12 text-[100px] md:text-[140px] font-black italic leading-none z-20 text-yellow-400" style={textShadow}>
                01
              </div>
              <div className="w-full md:w-1/2 z-10 flex flex-col justify-center mt-12 md:mt-0 md:pr-12">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-tight text-slate-800">無料登録＆プロフィール入力</h3>
                <p className="leading-relaxed text-sm md:text-base text-slate-600">まずはアプリから無料会員登録！あなたの現在の学年や志望校、今悩んでいることなどを簡単にプロフィールに入力します。</p>
              </div>
              <div className="w-full md:w-1/2 mt-10 md:mt-0 flex justify-center z-10">
                {/* */}
                <div className="relative mx-auto w-64 h-[520px] bg-white rounded-[2.5rem] border-[6px] border-slate-800 shadow-2xl overflow-hidden flex-shrink-0">
                  <div className="absolute top-0 inset-x-0 h-5 bg-slate-800 rounded-b-xl w-32 mx-auto z-30"></div>
                  <div className="w-full h-full relative z-10 overflow-hidden bg-white">
                    {/* */}
                    <div className="flex flex-col h-full bg-white">
                      <div className="bg-blue-50 text-blue-800 p-4 font-bold text-center border-b border-blue-100">プロフィール登録</div>
                      <div className="flex-1 p-5 space-y-4 overflow-hidden">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500">志望校</label>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-slate-800">〇〇大学</div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500">現在の学年</label>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-slate-800 flex justify-between">
                            高校3年生 <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                        <div className="mt-6 bg-blue-500 text-white text-center p-3 rounded-xl font-bold text-sm shadow-md">
                          登録してはじめる
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* */}
            <div className="relative flex flex-col md:flex-row items-center bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 max-w-4xl mx-auto w-full md:w-[85%] md:ml-auto md:mr-0">
              <div className="absolute -top-12 md:-top-16 -right-4 md:-right-12 text-[100px] md:text-[140px] font-black italic leading-none z-20 text-yellow-400" style={textShadow}>
                02
              </div>
              <div className="w-full md:w-1/2 z-10 flex flex-col justify-center mt-12 md:mt-0 md:pl-12 order-1 md:order-2">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-tight text-slate-800">志望する大学学部のメンターを探す！</h3>
                <p className="leading-relaxed text-sm md:text-base text-slate-600">豊富な在籍メンターの中から、志望校や学部、性格の合う先輩を検索して見つけましょう。詳細なプロフィールから選べます。</p>
              </div>
              <div className="w-full md:w-1/2 mt-10 md:mt-0 flex justify-center z-10 order-2 md:order-1">
                {/* */}
                <div className="relative mx-auto w-64 h-[520px] bg-white rounded-[2.5rem] border-[6px] border-slate-800 shadow-2xl overflow-hidden flex-shrink-0">
                  <div className="absolute top-0 inset-x-0 h-5 bg-slate-800 rounded-b-xl w-32 mx-auto z-30"></div>
                  <div className="w-full h-full relative z-10 overflow-hidden bg-white">
                    {/* */}
                    <div className="flex flex-col h-full bg-gray-50">
                      <div className="bg-white p-4 shadow-sm z-10 flex items-center justify-between border-b border-gray-100">
                        <div className="font-bold text-slate-800">メンターを探す</div>
                        <Search className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 p-4 space-y-3 overflow-hidden">

                        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-blue-600 font-bold mb-0.5 truncate">九州大学 薬学部</div>
                            <div className="font-bold text-sm text-slate-800 mb-0.5 truncate">中嶋 俊</div>
                            <div className="flex items-center gap-1 text-[10px] text-amber-500">
                              <Star className="w-3 h-3 fill-current" /><span className="text-slate-600 font-medium">4.8</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-blue-600 font-bold mb-0.5 truncate">東京大学 理科二類</div>
                            <div className="font-bold text-sm text-slate-800 mb-0.5 truncate">高田 茜</div>
                            <div className="flex items-center gap-1 text-[10px] text-amber-500">
                              <Star className="w-3 h-3 fill-current" /><span className="text-slate-600 font-medium">5.0</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-blue-600 font-bold mb-0.5 truncate">大阪大学 基礎工学部</div>
                            <div className="font-bold text-sm text-slate-800 mb-0.5 truncate">山上 結也</div>
                            <div className="flex items-center gap-1 text-[10px] text-amber-500">
                              <Star className="w-3 h-3 fill-current" /><span className="text-slate-600 font-medium">4.7</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* */}
            <div className="relative flex flex-col md:flex-row items-center bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 max-w-4xl mx-auto w-full md:w-[85%] md:mr-auto md:ml-0">
              <div className="absolute -top-12 md:-top-16 -left-4 md:-left-12 text-[100px] md:text-[140px] font-black italic leading-none z-20 text-yellow-400" style={textShadow}>
                03
              </div>
              <div className="w-full md:w-1/2 z-10 flex flex-col justify-center mt-12 md:mt-0 md:pr-12">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-tight text-slate-800">チャットで簡単！面談を予約する</h3>
                <p className="leading-relaxed text-sm md:text-base text-slate-600">気になるメンターが見つかったら、チャットで直接やり取り！メンターから送られてくる日時の提案をワンタップするだけで、面倒な手続きなく簡単に初回面談の予約が完了します。</p>
              </div>
              <div className="w-full md:w-1/2 mt-10 md:mt-0 flex justify-center z-10">
                {/* */}
                <div className="relative mx-auto w-64 h-[520px] bg-white rounded-[2.5rem] border-[6px] border-slate-800 shadow-2xl overflow-hidden flex-shrink-0">
                  <div className="absolute top-0 inset-x-0 h-5 bg-slate-800 rounded-b-xl w-32 mx-auto z-30"></div>
                  <div className="w-full h-full relative z-10 overflow-hidden bg-white">
                    <div className="flex flex-col h-full bg-white relative">
                      <div className="bg-white p-3 border-b border-gray-200 flex items-center gap-2 z-10 shadow-sm pt-8">
                        <ArrowLeft className="w-4 h-4 text-gray-500" />
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <User className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-slate-800 text-[11px] leading-tight">sample</div>
                          <div className="text-[9px] text-slate-400">高校3年生</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] font-bold text-slate-600">受験勉強全般</div>
                          <div className="text-[8px] text-slate-400">日時未定</div>
                        </div>
                      </div>

                      <div className="flex-1 p-4 space-y-4 overflow-hidden relative bg-slate-50">
                        <div className="text-center text-[10px] text-gray-400 my-1">3月16日</div>

                        <div className="flex justify-start items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                            <User className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="bg-white border border-gray-200 text-slate-700 rounded-2xl rounded-tl-sm p-3 max-w-[90%] text-xs shadow-sm">
                              こんにちは
                            </div>
                            <div className="text-[9px] text-gray-400 ml-1">22:05</div>
                          </div>
                        </div>

                        <div className="flex justify-start items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                            <User className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="flex flex-col gap-1 w-full max-w-[85%]">
                            <div className="bg-white border-2 border-blue-100 rounded-xl p-3 shadow-sm relative overflow-hidden">
                              <div className="flex items-center gap-1 text-blue-500 font-bold text-[10px] mb-2">
                                <Calendar className="w-3 h-3" /> 日時の提案
                              </div>
                              <div className="text-sm font-black text-slate-800 leading-tight">2026年3月20日</div>
                              <div className="text-xs font-bold text-slate-600 mb-3">10:30</div>
                              <button className="w-full bg-green-500 text-white font-bold py-2 rounded-lg text-xs shadow-sm hover:bg-green-600 transition-colors">
                                この日程で確定する
                              </button>
                            </div>
                            <div className="text-[9px] text-gray-400 ml-1">22:05</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-white border-t border-gray-200 mt-auto pb-6 flex items-center gap-2">
                        <div className="bg-gray-100 rounded-full h-9 flex-1 px-3 flex items-center text-[10px] text-gray-400 whitespace-nowrap overflow-hidden">
                          メッセージを入力... (Enterで送信)
                        </div>
                        <button className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col md:flex-row items-center bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 max-w-4xl mx-auto w-full md:w-[85%] md:ml-auto md:mr-0">
              <div className="absolute -top-12 md:-top-16 -right-4 md:-right-12 text-[100px] md:text-[140px] font-black italic leading-none z-20 text-yellow-400" style={textShadow}>
                04
              </div>
              <div className="w-full md:w-1/2 z-10 flex flex-col justify-center mt-12 md:mt-0 md:pl-12 order-1 md:order-2">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-tight text-slate-800">オンライン相談スタート！</h3>
                <p className="leading-relaxed text-sm md:text-base text-slate-600">予約時間になったらアプリからビデオ通話を開始。「情報戦」を勝ち抜くための第一歩をここから始めましょう！</p>
              </div>
              <div className="w-full md:w-1/2 mt-10 md:mt-0 flex justify-center z-10 order-2 md:order-1">
                <div className="relative mx-auto w-64 h-[520px] bg-white rounded-[2.5rem] border-[6px] border-slate-800 shadow-2xl overflow-hidden flex-shrink-0">
                  <div className="absolute top-0 inset-x-0 h-5 bg-slate-800 rounded-b-xl w-32 mx-auto z-30"></div>
                  <div className="w-full h-full relative z-10 overflow-hidden bg-white">
                    <div className="flex flex-col h-full bg-slate-900 relative">
                      <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2 backdrop-blur-sm z-20">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> 00:15:32
                      </div>
                      <div className="flex-1 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                          <User className="w-24 h-24 text-slate-600" />
                        </div>
                        <div className="absolute bottom-20 right-4 w-20 h-32 bg-slate-700 rounded-lg border-2 border-slate-600 shadow-lg flex items-center justify-center overflow-hidden">
                          <User className="w-10 h-10 text-slate-500" />
                        </div>
                      </div>

                      <div className="bg-slate-900 p-4 flex justify-center gap-4 border-t border-slate-800 z-10">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-white" /></div>
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-lg"><Video className="w-5 h-5 text-white" /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-24 text-center">
            <Link href="/signup">
              <button className="bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-extrabold text-xl md:text-2xl px-12 py-5 rounded-full shadow-xl transform transition hover:-translate-y-1 hover:shadow-2xl flex items-center gap-3 mx-auto">
                無料でJaoRiumをはじめる <ChevronRight className="w-6 h-6" />
              </button>
            </Link>
            <p className="text-white mt-4 text-sm opacity-80">※登録は1分で完了します</p>
          </div>

        </div>
      </section>
      {/* <script>
        lucide.createIcons();
      </script> */}
    </>
    // <div classNameName="py-20 md:py-28 bg-white">
    //   <div classNameName="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    //     <div classNameName="text-center mb-16">
    //       <h2 classNameName="text-3xl md:text-5xl font-bold mb-4">面談の仕方</h2>
    //       <p classNameName="text-2xl text-blue-600 font-medium">最短30分後に出会える</p>
    //     </div>

    //     <div classNameName="grid grid-cols-1 md:grid-cols-3 gap-8">
    //       {/* STEP 01 */}
    //       <div classNameName="bg-linear-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-lg">
    //         <div classNameName="flex items-center gap-3 mb-6">
    //           <Sparkles size={32} classNameName="text-blue-600" />
    //           <div>
    //             <p classNameName="text-sm font-bold text-gray-500">STEP 01</p>
    //             <h3 classNameName="text-2xl font-bold">マッチング診断</h3>
    //           </div>
    //         </div>
    //         <p classNameName="text-gray-700 leading-relaxed">
    //           志望する大学・学部や聞きたい内容を答えるだけで、あなたにあったメンターを提案します！
    //         </p>
    //       </div>

    //       {/* STEP 02 */}
    //       <div classNameName="bg-linear-to-br from-green-50 to-emerald-50 p-8 rounded-2xl shadow-lg">
    //         <div classNameName="flex items-center gap-3 mb-6">
    //           <Calendar size={32} classNameName="text-green-600" />
    //           <div>
    //             <p classNameName="text-sm font-bold text-gray-500">STEP 02</p>
    //             <h3 classNameName="text-2xl font-bold">選択・日程調整</h3>
    //           </div>
    //         </div>
    //         <p classNameName="text-gray-700 leading-relaxed">
    //           チャットで事前に直接相談も可能！
    //         </p>
    //       </div>

    //       {/* STEP 03 */}
    //       <div classNameName="bg-linear-to-br from-purple-50 to-pink-50 p-8 rounded-2xl shadow-lg">
    //         <div classNameName="flex items-center gap-3 mb-6">
    //           <Video size={32} classNameName="text-purple-600" />
    //           <div>
    //             <p classNameName="text-sm font-bold text-gray-500">STEP 03</p>
    //             <h3 classNameName="text-2xl font-bold">対話スタート</h3>
    //           </div>
    //         </div>
    //         <p classNameName="text-gray-700 leading-relaxed">
    //           予約時間に入室。<br/>
    //           最短1時間後から可能！
    //         </p>
    //       </div>
    //     </div>
    //   </div>
    // </div>
  );
}