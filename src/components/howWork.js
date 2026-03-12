import { Sparkles, Calendar, Video } from "lucide-react";

export default function HowWork() {
    return(
      <div className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">面談の仕方</h2>
            <p className="text-2xl text-blue-600 font-medium">最短30分後に出会える</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* STEP 01 */}
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles size={32} className="text-blue-600" />
                <div>
                  <p className="text-sm font-bold text-gray-500">STEP 01</p>
                  <h3 className="text-2xl font-bold">マッチング診断</h3>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                志望する大学・学部や聞きたい内容を答えるだけで、あなたにあったメンターを提案します！
              </p>
            </div>

            {/* STEP 02 */}
            <div className="bg-linear-to-br from-green-50 to-emerald-50 p-8 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <Calendar size={32} className="text-green-600" />
                <div>
                  <p className="text-sm font-bold text-gray-500">STEP 02</p>
                  <h3 className="text-2xl font-bold">選択・日程調整</h3>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                チャットで事前に直接相談も可能！
              </p>
            </div>

            {/* STEP 03 */}
            <div className="bg-linear-to-br from-purple-50 to-pink-50 p-8 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <Video size={32} className="text-purple-600" />
                <div>
                  <p className="text-sm font-bold text-gray-500">STEP 03</p>
                  <h3 className="text-2xl font-bold">対話スタート</h3>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                予約時間に入室。<br/>
                最短1時間後から可能！
              </p>
            </div>
          </div>
        </div>
      </div>
    );
}