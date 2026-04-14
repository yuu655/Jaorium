export default function TimeLine() {
  return (
    <div className="py-20 md:py-28 bg-gray-900 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            40分間で、
            <br className="md:hidden" />
            未来が動く。
          </h2>
          <p className="text-xl text-gray-300 mt-4">
            ただの雑談ではありません。
            <br />
            あなたの悩みを解決するための濃密な40分です。
          </p>
        </div>

        <div className="space-y-8">
          {/* 5分 */}
          <div className="flex gap-6 items-start">
            <div className="shrink-0">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                05m
              </div>
            </div>
            <div className="flex-1 bg-gray-800 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-2">
                アイスブレイク & ゴール設定
              </h3>
              <p className="text-gray-300">
                緊張しなくて大丈夫。まずはリラックスして、今日話し終わった後に「どうなっていたいか」を一緒に決めます。
              </p>
            </div>
          </div>

          {/* 15分 */}
          <div className="flex gap-6 items-start">
            <div className="shrink-0">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                15m
              </div>
            </div>
            <div className="flex-1 bg-gray-800 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-2">現状の深掘り (Why)</h3>
              <p className="text-gray-300">
                「なぜその進路に？」「今一番の壁は？」対話を通して、あなた自身も気づいていない「本当の悩み」を見つけ出します。
              </p>
            </div>
          </div>

          {/* 35分 */}
          <div className="flex gap-6 items-start">
            <div className="shrink-0">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                35m
              </div>
            </div>
            <div className="flex-1 bg-gray-800 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-2">
                具体的なアドバイス (How)
              </h3>
              <p className="text-gray-300">
                ネットにはないリアルな経験談をシェア。試験対策、実際の大学生活など、具体的かつあなたに合った解決策を提示します。
              </p>
            </div>
          </div>

          {/* 40分 */}
          <div className="flex gap-6 items-start">
            <div className="shrink-0">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                40m
              </div>
            </div>
            <div className="flex-1 bg-gray-800 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-2">ネクストアクション</h3>
              <p className="text-gray-300">
                「明日から何をするか」を明確にして終了。満足感とやる気を持って、次の一歩を踏み出せます。
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="shrink-0">
              <div className="w-16 h-16 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                After
              </div>
            </div>
            <div className="flex-1 bg-gray-800 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-2">フィードバックアンケート</h3>
              <p className="text-gray-300">
                今後のじゃおりうむの活動に役立てます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
