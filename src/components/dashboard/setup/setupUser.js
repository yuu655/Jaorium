export default function SetupUser({ func }) {
  return (
    <form className="space-y-8">
      {/* Contact Information */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <h3 className="text-lg font-bold mb-4">アカウント情報</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">ユーザーネーム *</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="山田 太郎"
            />
          </div>
          <div>
            <label htmlFor="grade" className="block text-sm font-medium mb-2">学年</label>
            <select id="grade" name="grade" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black">
              <option value="">選択してください</option>
              <option>高校3年生</option>
              <option>高校2年生</option>
              <option>高校1年生</option>
              <option>浪人生</option>
              <option>その他</option>
            </select>
          </div>
        </div>
      </div>

      {/* Terms */}
      {/* <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
        <label className="flex items-start gap-3">
          <input type="checkbox" required className="mt-1" />
          <span className="text-sm">
            <a href="#" className="text-blue-600 hover:underline">
              利用規約
            </a>
            および
            <a href="#" className="text-blue-600 hover:underline">
              プライバシーポリシー
            </a>
            に同意します
          </span>
        </label>
      </div> */}

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          className="w-full px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors"
          formAction={func}
        >
          登録する
        </button>
        {/* <p className="text-sm text-gray-600 text-center mt-4">
          送信後、メンターが確認し、24時間以内にメールでご連絡します。
        </p> */}
      </div>
    </form>
  );
}
