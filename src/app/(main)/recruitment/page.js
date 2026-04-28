import Image from "next/image";

export default function Recruitment() {
  return (
    <>
      <section className="relative pt-20 h-[600px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <div className="relative w-full h-full">
            <Image
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
              alt="Campus"
              fill
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-slate-900/60"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 text-white drop-shadow-lg">
            あなたの
            <span className="text-brand-blue bg-white px-2 py-1 mx-1 rounded-sm shadow-sm inline-block text-blue-600">
              受験経験
            </span>
            が、
            <br className="hidden md:block" />
            未来の価値に変わる。
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-10 leading-relaxed font-medium drop-shadow-md max-w-3xl mx-auto bg-slate-900/40 p-4 rounded-lg backdrop-blur-sm border border-white/10">
            JaoRiumは、あなたの「
            <span className="text-red-400 font-bold">乗り越えた経験</span>
            」を求めている高校生とマッチングするプラットフォーム。報酬を得ながら、就活に直結するスキルと人脈を手に入れませんか？
          </p>
          <a
            href="#register"
            className="inline-block bg-brand-blue text-white px-10 py-4 rounded-md font-bold text-lg hover:bg-blue-600 transition-colors shadow-lg"
          >
            今すぐメンターを始める
          </a>
        </div>
      </section>

      <section className="py-24 bg-slate-50" id="reasons">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              JaoRiumメンターが
              <br className="md:hidden" />
              <span className="text-brand-blue">選ばれる3つの理由</span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              単なるアルバイトではありません。あなたの経験を最大限に活かし、自身の成長と将来のキャリアに繋がる環境がここにあります。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="text-brand-blue mb-6">
                <i data-lucide="coins" className="w-10 h-10"></i>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-brand-blue font-black text-xl">01</span>
                <h3 className="text-2xl font-bold text-slate-900">
                  受験経験が「<span className="text-red-600">価値</span>」に
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                辛く苦しかった受験勉強。その試行錯誤して乗り越えた経験は、今悩んでいる高校生にとって喉から手が出るほど欲しい情報です。あなたのリアルな経験を直接伝えることで、それが「報酬」という目に見える価値に変わります。
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="text-brand-orange mb-6">
                <i data-lucide="presentation" className="w-10 h-10"></i>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-brand-orange font-black text-xl">02</span>
                <h3 className="text-2xl font-bold text-slate-900">
                  <span className="text-red-600">プレゼン力</span>を伸ばせる
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                生徒の課題を引き出し、わかりやすく教え、モチベーションを上げる。メンターとしての活動は、社会に出てから必須となる「論理的思考力」や「プレゼン能力」を実践的に鍛える最高のトレーニングの場になります。
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="text-emerald-600 mb-6">
                <i data-lucide="building-2" className="w-10 h-10"></i>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-emerald-600 font-black text-xl">03</span>
                <h3 className="text-2xl font-bold text-slate-900">
                  スポンサー企業と繋がる
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                JaoRiumには多数の企業がスポンサーとして参画しています。優秀なメンターとして活動するあなたの実績は企業にも共有され、スカウトや特別イベントへの招待など、周りより一足早く、有利に就職活動を始めることができます。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-brand-blue text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              はじめるまでの<span className="text-brand-orange">4</span>ステップ
            </h2>
            <p className="text-white/90 max-w-2xl mx-auto">
              面談の準備は運営にお任せ。あなたは経験を話すだけ！
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div className="bg-white text-slate-800 rounded-2xl p-8 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-bl-full -mr-10 -mt-10 z-0"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 text-center md:text-left order-2 md:order-1">
                  <div className="text-brand-orange font-black text-5xl mb-2">
                    01
                  </div>
                  <h3 className="text-xl font-bold mb-4">メンター登録</h3>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    まずはこのページからアカウントを作成。基本的なプロフィール情報を入力します。
                  </p>
                  <div className="bg-slate-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto md:mx-0">
                    <i
                      data-lucide="user-plus"
                      className="w-6 h-6 text-brand-blue"
                    ></i>
                  </div>
                </div>
                <div className="flex-1 order-1 md:order-2 flex justify-center">
                  <div className="w-48 h-[340px] border-[6px] border-slate-800 rounded-[2rem] overflow-hidden shadow-xl bg-white relative">
                    <div className="absolute top-0 inset-x-0 h-4 bg-slate-800 w-1/2 mx-auto rounded-b-xl z-20"></div>
                    <div className="p-4 pt-8 h-full flex flex-col relative z-10 bg-slate-50">
                      <div className="text-center text-sm font-bold text-brand-blue mb-6">
                        プロフィール登録
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="text-[10px] text-slate-500 mb-1">
                            お名前
                          </div>
                          <div className="bg-white rounded p-2 border border-slate-200 text-xs text-slate-400">
                            佐藤 健太
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 mb-1">
                            現在の学年
                          </div>
                          <div className="bg-white rounded p-2 border border-slate-200 text-xs text-slate-400 flex justify-between items-center">
                            <span>大学2年生</span>
                            <i
                              data-lucide="chevron-down"
                              className="w-3 h-3 text-slate-400"
                            ></i>
                          </div>
                        </div>
                        <div className="mt-6">
                          <div className="bg-brand-blue text-white text-xs font-bold text-center py-3 rounded shadow-sm">
                            登録してはじめる
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white text-slate-800 rounded-2xl p-8 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/10 rounded-bl-full -mr-10 -mt-10 z-0"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 text-center md:text-left order-2 md:order-1">
                  <div className="text-brand-blue font-black text-5xl mb-2">
                    02
                  </div>
                  <h3 className="text-xl font-bold mb-4">
                    詳細情報入力 (Googleフォーム)
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    運営から送られるGoogleフォームで、自身の受験経験や得意な指導内容を詳しく記入します。
                  </p>
                  <div className="bg-slate-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto md:mx-0">
                    <i
                      data-lucide="clipboard-list"
                      className="w-6 h-6 text-brand-blue"
                    ></i>
                  </div>
                </div>
                <div className="flex-1 order-1 md:order-2 flex justify-center">
                  <div className="w-48 h-[340px] border-[6px] border-slate-800 rounded-[2rem] overflow-hidden shadow-xl bg-white relative">
                    <div className="absolute top-0 inset-x-0 h-4 bg-slate-800 w-1/2 mx-auto rounded-b-xl z-20"></div>
                    <div className="p-0 h-full flex flex-col relative z-10 bg-[#F0EBF8]">
                      <div className="h-16 bg-white flex flex-col justify-end">
                        <div className="h-2 w-full bg-[#673AB7]"></div>
                      </div>
                      <div className="p-3 space-y-3 mt-[-10px]">
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                          <div className="text-xs font-bold text-slate-800 mb-2">
                            メンター詳細登録
                          </div>
                          <div className="w-2/3 h-1.5 bg-slate-200 rounded"></div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                          <div className="text-[10px] text-slate-800 mb-3">
                            得意な科目は？{" "}
                            <span className="text-red-500">*</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>
                            <div className="w-16 h-1.5 bg-slate-200 rounded"></div>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full border-2 border-[#673AB7] flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-[#673AB7] rounded-full"></div>
                            </div>
                            <div className="w-12 h-1.5 bg-slate-200 rounded"></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>
                            <div className="w-14 h-1.5 bg-slate-200 rounded"></div>
                          </div>
                        </div>
                        <div className="bg-[#673AB7] text-white text-[10px] font-bold text-center py-2 rounded w-1/2 shadow-sm">
                          送信
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white text-slate-800 rounded-2xl p-8 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-bl-full -mr-10 -mt-10 z-0"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 text-center md:text-left order-2 md:order-1">
                  <div className="text-brand-orange font-black text-5xl mb-2">
                    03
                  </div>
                  <h3 className="text-xl font-bold mb-4">
                    運営によるスライド作成
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    記入いただいた情報を元に、運営側で生徒へのプレゼン用スライドを作成します。手間なく準備完了！
                  </p>
                  <div className="bg-slate-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto md:mx-0">
                    <i
                      data-lucide="presentation"
                      className="w-6 h-6 text-brand-blue"
                    ></i>
                  </div>
                </div>
                <div className="flex-1 order-1 md:order-2 flex justify-center">
                  <div className="w-48 h-[340px] border-[6px] border-slate-800 rounded-[2rem] overflow-hidden shadow-xl bg-white relative">
                    <div className="absolute top-0 inset-x-0 h-4 bg-slate-800 w-1/2 mx-auto rounded-b-xl z-20"></div>
                    <div className="p-3 pt-8 h-full flex flex-col relative z-10 bg-slate-50">
                      <div className="text-center text-xs font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200">
                        完成したスライド
                      </div>
                      <div className="space-y-3 flex-1 overflow-y-auto pb-4 no-scrollbar">
                        <div className="bg-white border-2 border-brand-blue rounded shadow-sm relative aspect-video flex flex-col overflow-hidden">
                          <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-brand-blue"></div>
                          <div className="absolute -left-1 -top-1 bg-brand-blue text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md z-10">
                            1
                          </div>

                          <div className="flex-1 flex flex-col items-center justify-center p-2 relative">
                            <div className="text-[10px] font-black text-slate-800 mb-1">
                              JaoRium メンター面談
                            </div>

                            <div className="w-12 h-12 my-0.5 flex items-center justify-center">
                              <Image
                                src="/logo.png"
                                alt="ロゴ"
                                width={70}
                                height={70}
                                className="w-full h-full object-contain"
                              />
                            </div>

                            <div className="text-[6px] font-bold text-brand-blue mt-0.5">
                              本日はよろしくお願いします！
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded shadow-sm relative aspect-video flex flex-col overflow-hidden opacity-90">
                          <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-brand-blue"></div>
                          <div className="absolute -left-1 -top-1 bg-slate-400 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md z-10">
                            2
                          </div>

                          <div className="p-2 flex-1 flex flex-col">
                            <div className="flex items-center gap-1 mb-1">
                              <div className="w-0.5 h-3 bg-purple-700"></div>
                              <div className="text-[9px] font-bold text-slate-800">
                                自己紹介
                              </div>
                            </div>

                            <div className="flex flex-1 gap-1">
                              <div className="flex-1 flex flex-col justify-center gap-1">
                                <div className="flex items-center gap-1">
                                  <i
                                    data-lucide="user"
                                    className="w-2.5 h-2.5 text-brand-blue"
                                  ></i>
                                  <div className="text-[5px] text-slate-500">
                                    氏名: [ 入力 ]
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <i
                                    data-lucide="graduation-cap"
                                    className="w-2.5 h-2.5 text-purple-700"
                                  ></i>
                                  <div className="text-[5px] text-slate-500">
                                    所属: [ 大学・学部 ]
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <i
                                    data-lucide="users"
                                    className="w-2.5 h-2.5 text-purple-700"
                                  ></i>
                                  <div className="text-[5px] text-slate-500">
                                    サークル等: [ 入力 ]
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <i
                                    data-lucide="star"
                                    className="w-2.5 h-2.5 text-brand-blue"
                                  ></i>
                                  <div className="text-[5px] text-slate-500">
                                    趣味・特技: [ 入力 ]
                                  </div>
                                </div>
                                <div className="text-[5px] font-bold text-red-500 mt-0.5 transform origin-left scale-90 w-[120%]">
                                  気軽に何でも相談してくださいね！
                                </div>
                              </div>
                              <div className="w-10 flex items-center justify-center">
                                <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-100 bg-slate-100">
                                  <div className="relative w-full h-64">
                                    <Image
                                      src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                                      alt="Mentor"
                                      fill
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white text-slate-800 rounded-2xl p-8 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/10 rounded-bl-full -mr-10 -mt-10 z-0"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 text-center md:text-left order-2 md:order-1">
                  <div className="text-brand-blue font-black text-5xl mb-2">
                    04
                  </div>
                  <h3 className="text-xl font-bold mb-4">マッチング & 面談</h3>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    生徒から指名が入ったら、日程を調整して面談を実施。作成されたスライドを使って話すだけ！
                  </p>
                  <div className="bg-slate-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto md:mx-0">
                    <i
                      data-lucide="video"
                      className="w-6 h-6 text-brand-blue"
                    ></i>
                  </div>
                </div>
                <div className="flex-1 order-1 md:order-2 flex justify-center">
                  <div className="w-48 h-[340px] border-[6px] border-slate-800 rounded-[2rem] overflow-hidden shadow-xl bg-white relative">
                    <div className="absolute top-0 inset-x-0 h-4 bg-slate-800 w-1/2 mx-auto rounded-b-xl z-20"></div>
                    <div className="p-0 h-full flex flex-col relative z-10 bg-slate-900">
                      <div className="flex-1 relative">
                        <div className="relative w-full h-64">
                          <Image
                            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                            alt="Student"
                            fill
                            className="w-full h-full object-cover opacity-70"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                        <div className="absolute bottom-16 right-3 w-14 h-20 border-2 border-white rounded-lg overflow-hidden shadow-lg">
                          <Image
                            src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
                            alt="Mentor"
                            fill
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute bottom-4 inset-x-0 flex justify-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-slate-700/80 flex items-center justify-center backdrop-blur-sm">
                            <i
                              data-lucide="mic"
                              className="w-4 h-4 text-white"
                            ></i>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-slate-700/80 flex items-center justify-center backdrop-blur-sm">
                            <i
                              data-lucide="video"
                              className="w-4 h-4 text-white"
                            ></i>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                            <i
                              data-lucide="phone-off"
                              className="w-4 h-4 text-white"
                            ></i>
                          </div>
                        </div>
                      </div>
                      <div className="h-12 bg-white flex items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                          <div className="text-xs font-bold text-slate-800">
                            面談中 12:05
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">
            あなたの経験を、待っている人がいます。
          </h2>
          <p className="text-slate-600 text-lg mb-10">
            登録は無料です。まずは簡単なプロフィール登録から始めましょう。
          </p>
          <a
            href="#register"
            className="inline-flex items-center gap-2 bg-brand-blue text-white px-12 py-5 rounded-md font-bold text-xl hover:bg-blue-600 transition-colors shadow-lg"
          >
            今すぐメンターを始める
            <i data-lucide="arrow-right" className="w-6 h-6"></i>
          </a>
        </div>
      </section>
    </>
  );
}
