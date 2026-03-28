export default function Concept() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative py-20 md:py-32 bg-linear-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            情報戦に、終止符を。
          </h1>
          <p className="text-2xl md:text-3xl text-gray-700">
            「知らなかった」で夢を諦める人を、ゼロにする。
          </p>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 text-lg md:text-xl text-gray-700 leading-relaxed">
            <p>
              「あこがれの大学があるけれど、周りに行った人がいないから無理かもしれない」
            </p>
            <p>
              「地方に住んでいるから、オープンキャンパスに行けない」
            </p>
            <p>
              そんな理由で、自分の可能性に蓋をしてしまう高校生がたくさんいます。
            </p>
            <p>
              偏差値や倍率は検索できても、「その場所で自分がどう生きていけるか」というリアルな手触りは、ネットには落ちていません。
            </p>
            <p>
              だから私たちは、JaoRium（じゃおりうむ）を作りました。ここは、あなたの好きな時間・場所で気軽に先輩とつながり、本音で話せる場所です。
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy - MVV */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">OUR PHILOSOPHY</h2>

          <div className="space-y-16">
            {/* Mission */}
            <div className="bg-white p-8 md:p-12 rounded-xl shadow-md">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-2 h-12 bg-black" />
                <div>
                  <h3 className="text-sm font-bold text-gray-500 mb-1">MISSION</h3>
                  <p className="text-3xl md:text-4xl font-bold">情報戦に終止符を。</p>
                </div>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                受験はしばしば「情報戦」と言われます。どれだけ良質な情報にアクセスできるかにより、合否が左右されてしまうこともあります。
                しかし、その情報へのアクセスは、経済力や住んでいる地域によって大きく制限されています。
                私たちは、この構造的な不平等に終止符を打ちます。
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white p-8 md:p-12 rounded-xl shadow-md">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-2 h-12 bg-black" />
                <div>
                  <h3 className="text-sm font-bold text-gray-500 mb-1">VISION</h3>
                  <p className="text-3xl md:text-4xl font-bold">
                    「知らなかった」で<br className="md:hidden" />夢を諦める人を、ゼロにする。
                  </p>
                </div>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                「もっと早く知っていれば...」「その選択肢があることを知らなかった...」
                そんな後悔を、誰にもさせたくない。すべての受験生が、等しく情報にアクセスでき、
                自分の可能性を最大限に広げられる社会を実現します。
              </p>
            </div>

            {/* Values */}
            <div className="bg-white p-8 md:p-12 rounded-xl shadow-md">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-2 h-12 bg-black" />
                <div>
                  <h3 className="text-sm font-bold text-gray-500 mb-1">VALUES</h3>
                  <p className="text-3xl md:text-4xl font-bold">私たちの約束</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h4 className="text-2xl font-bold mb-3">Give Real</h4>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    綺麗な建前ではなく、泥臭い一次情報を提供します。
                    失敗談も、試行錯誤も、すべてをリアルに共有する。それが、本当の価値だと信じています。
                  </p>
                </div>

                <div>
                  <h4 className="text-2xl font-bold mb-3">Open Door</h4>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    誰にでも開かれた場所にします。無料で、オープンに。
                    経済的な事情や地理的な制約で、扉が閉ざされることがあってはなりません。
                  </p>
                </div>

                <div>
                  <h4 className="text-2xl font-bold mb-3">Pay it Forward</h4>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    恩送りのサイクルを作ります。今日サポートを受けた受験生が、
                    明日は誰かをサポートする側に回る。そんな循環を、社会に根付かせます。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">JaoRiumについて</h2>

          <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
            <p>JaoRiumは、受験における「一次情報」を必要としているすべての高校生に、<br />完全無料で届けることを目的とした教育支援プロジェクトです。</p>

            <p>大学生のリアルな受験・進学経験を社会に還元すると同時に、<br />情報を届ける大学生には、次の挑戦の場となる「企業」とのつながりも創出しています。</p>
          </div>

          <div className="mt-12 p-8 bg-gray-50 rounded-lg">
            <p className="text-center text-lg font-medium text-gray-700">
              一緒に、情報格差のない社会を作りませんか？
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
