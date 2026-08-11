"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveJoinRequest,
  rejectJoinRequest,
  removeMember,
  setMemberCreditLimit,
  regenerateJoinCode,
  requestCreditTopUp,
} from "@/app/(userPage)/dashboard/organization/actions";

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrganizationOwnerDashboard({ organization, balance, members, joinRequests, logs }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState(null);
  const [joinCode, setJoinCode] = useState(organization?.join_code ?? "");
  const [topUpNote, setTopUpNote] = useState("");
  const [topUpSending, setTopUpSending] = useState(false);
  const [limitDrafts, setLimitDrafts] = useState({});

  const withBusy = async (id, fn) => {
    setBusyId(id);
    const result = await fn();
    setBusyId(null);
    if (result?.error) alert(result.error);
    if (result?.success) router.refresh();
    return result;
  };

  const handleApprove = (requestId) =>
    withBusy(requestId, () => approveJoinRequest(requestId, organization.id));

  const handleReject = (requestId) =>
    withBusy(requestId, () => rejectJoinRequest(requestId, organization.id));

  const handleRemove = (memberId) => {
    if (!confirm("このメンバーを組織から削除しますか？")) return;
    return withBusy(memberId, () => removeMember(memberId, organization.id));
  };

  const handleSaveLimit = (memberId) => {
    const draft = limitDrafts[memberId];
    const limit = draft === undefined || draft === "" ? null : draft;
    return withBusy(memberId, () => setMemberCreditLimit(memberId, organization.id, limit));
  };

  const handleRegenerateCode = async () => {
    if (!confirm("コードを再発行すると、以前のコードは使えなくなります。よろしいですか？")) return;
    const result = await withBusy("regenerate", () => regenerateJoinCode(organization.id));
    if (result?.joinCode) setJoinCode(result.joinCode);
  };

  const handleRequestTopUp = async () => {
    setTopUpSending(true);
    const result = await requestCreditTopUp(organization.id, topUpNote);
    setTopUpSending(false);
    if (result?.error) {
      alert(result.error);
    } else {
      alert("追加を依頼しました。運営からの連絡をお待ちください。");
      setTopUpNote("");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{organization?.name}</h1>
        <div className="flex items-center gap-3 mt-2">
          <p className="text-sm text-gray-600">
            組織コード: <span className="font-mono font-bold text-gray-900">{joinCode}</span>
          </p>
          <button
            onClick={handleRegenerateCode}
            disabled={busyId === "regenerate"}
            className="text-xs text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
          >
            {busyId === "regenerate" ? "再発行中..." : "コードを再発行"}
          </button>
        </div>
      </div>

      {/* 共有残高 */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-3">共有クレジット残高</h2>
        <p className="text-3xl font-bold">
          {balance} <span className="text-base font-normal text-gray-500">回分</span>
        </p>
        <div className="mt-4 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">運営への備考（任意）</label>
            <input
              type="text"
              value={topUpNote}
              onChange={(e) => setTopUpNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="例: 追加で20回分お願いします"
            />
          </div>
          <button
            onClick={handleRequestTopUp}
            disabled={topUpSending}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 shrink-0"
          >
            {topUpSending ? "送信中..." : "追加を依頼"}
          </button>
        </div>
      </section>

      {/* 保留中の参加申請 */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-3">参加申請（{joinRequests.length}件）</h2>
        {joinRequests.length === 0 ? (
          <p className="text-sm text-gray-500">保留中の申請はありません。</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {joinRequests.map((request) => (
              <li key={request.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{request.name}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(request.requested_at)}に申請</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={busyId === request.id}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    承認
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={busyId === request.id}
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    却下
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* メンバー一覧 */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-3">メンバー（{members.length}名）</h2>
        {members.length === 0 ? (
          <p className="text-sm text-gray-500">メンバーはまだいません。</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {members.map((member) => (
              <li key={member.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-xs text-gray-500">
                    利用実績: {member.credits_used}回
                    {member.credit_limit != null ? ` / 上限${member.credit_limit}回` : "（上限なし）"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    min={0}
                    placeholder="無制限"
                    value={limitDrafts[member.id] ?? member.credit_limit ?? ""}
                    onChange={(e) =>
                      setLimitDrafts((prev) => ({ ...prev, [member.id]: e.target.value }))
                    }
                    className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <button
                    onClick={() => handleSaveLimit(member.id)}
                    disabled={busyId === member.id}
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    上限を保存
                  </button>
                  <button
                    onClick={() => handleRemove(member.id)}
                    disabled={busyId === member.id}
                    className="px-3 py-1.5 text-red-600 text-xs font-medium hover:text-red-700 disabled:opacity-50"
                  >
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 消費履歴 */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-3">クレジット利用履歴</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500">履歴はまだありません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4">日時</th>
                  <th className="py-2 pr-4">内容</th>
                  <th className="py-2 pr-4">増減</th>
                  <th className="py-2">利用者</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50">
                    <td className="py-2 pr-4 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                    <td className="py-2 pr-4">
                      {log.reason === "manual_grant" ? "クレジット付与" : "面談で利用"}
                    </td>
                    <td className={`py-2 pr-4 font-medium ${log.change > 0 ? "text-blue-600" : "text-gray-700"}`}>
                      {log.change > 0 ? `+${log.change}` : log.change}
                    </td>
                    <td className="py-2">{log.spentByName ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
