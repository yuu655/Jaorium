"use client"

import { useState } from "react";

export default function SetupMentor({ func }) {
  const [details, setDetails] = useState();
  return (
    <form className="space-y-8">
      {/* Contact Information */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <h3 className="text-lg font-bold mb-4">アカウント情報</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              ユーザーネーム *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="山田 太郎"
            />
          </div>
          <div>
            <label
              htmlFor="university"
              className="block text-sm font-medium mb-2"
            >
              大学 *
            </label>
            <input
              type="text"
              id="university"
              name="university"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="某大学"
            />
          </div>
          <div>
            <label htmlFor="faculty" className="block text-sm font-medium mb-2">
              学部 *
            </label>
            <input
              type="text"
              id="faculty"
              name="faculty"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="工学部"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">詳細</label>
            <textarea
              id="description"
              name="description"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={5}
              placeholder="例：地方の公立高校に通っていて、東大を目指しています。どのように情報収集すればいいか相談したいです。"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>
          <div>
            <label htmlFor="region" className="block text-sm font-medium mb-2">出身地域</label>
            <select id="region" name="region" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black">
              <option value="">選択してください</option>
              <option>北海道・東北</option>
              <option>関東</option>
              <option>中部</option>
              <option>関西</option>
              <option>中国・四国</option>
              <option>九州・沖縄</option>
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
