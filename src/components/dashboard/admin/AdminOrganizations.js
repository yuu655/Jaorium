"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createOrganization,
  assignOwner,
  removeOwner,
  deleteOrganization,
  grantOrganizationCredits,
} from "@/app/(userPage)/dashboard/admin/organizations/actions";

export default function AdminOrganizations({ organizations }) {
  const router = useRouter();
  const [newOrgName, setNewOrgName] = useState("");
  const [creating, setCreating] = useState(false);
  const [ownerEmailDrafts, setOwnerEmailDrafts] = useState({});
  const [grantAmountDrafts, setGrantAmountDrafts] = useState({});
  const [busyId, setBusyId] = useState(null);

  const handleCreateOrganization = async () => {
    setCreating(true);
    const result = await createOrganization(newOrgName);
    setCreating(false);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setNewOrgName("");
    router.refresh();
  };

  const handleAssignOwner = async (organizationId) => {
    const email = ownerEmailDrafts[organizationId] ?? "";
    setBusyId(`owner-${organizationId}`);
    const result = await assignOwner(organizationId, email);
    setBusyId(null);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setOwnerEmailDrafts((prev) => ({ ...prev, [organizationId]: "" }));
    router.refresh();
  };

  const handleGrantCredits = async (organizationId) => {
    const amount = grantAmountDrafts[organizationId] ?? "";
    setBusyId(`grant-${organizationId}`);
    const result = await grantOrganizationCredits(organizationId, amount, "");
    setBusyId(null);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setGrantAmountDrafts((prev) => ({ ...prev, [organizationId]: "" }));
    router.refresh();
  };

  const handleRemoveOwner = async (organizationId, userId) => {
    if (!confirm("このownerを削除しますか？")) return;
    setBusyId(`owner-remove-${userId}`);
    const result = await removeOwner(organizationId, userId);
    setBusyId(null);
    if (result?.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  };

  const handleDeleteOrganization = async (organizationId) => {
    if (!confirm("この組織を削除しますか？（一覧から非表示になります。クレジット履歴等のデータは保持されます）"))
      return;
    setBusyId(`delete-${organizationId}`);
    const result = await deleteOrganization(organizationId);
    setBusyId(null);
    if (result?.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <h1 className="text-2xl font-bold">組織管理</h1>

      {/* 組織作成 */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-3">組織を作成</h2>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">組織名</label>
            <input
              type="text"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="例: ○○学習塾"
            />
          </div>
          <button
            onClick={handleCreateOrganization}
            disabled={creating}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 shrink-0"
          >
            {creating ? "作成中..." : "作成する"}
          </button>
        </div>
      </section>

      {/* 組織一覧 */}
      <section className="space-y-4">
        {organizations.length === 0 ? (
          <p className="text-sm text-gray-500">組織はまだありません。</p>
        ) : (
          organizations.map((org) => (
            <div key={org.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold">{org.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    コード: <span className="font-mono">{org.join_code}</span> ／ 残高: {org.balance}回 ／
                    メンバー{org.memberCount}名
                  </p>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>owner:</span>
                    {org.owners.length === 0 ? (
                      <span>未設定</span>
                    ) : (
                      org.owners.map((owner) => (
                        <span
                          key={owner.userId}
                          className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-2 py-0.5"
                        >
                          {owner.email}
                          <button
                            onClick={() => handleRemoveOwner(org.id, owner.userId)}
                            disabled={busyId === `owner-remove-${owner.userId}`}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                            title="ownerを削除"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteOrganization(org.id)}
                  disabled={busyId === `delete-${org.id}`}
                  className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50 shrink-0"
                >
                  組織を削除
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ownerを追加（メールアドレス）</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={ownerEmailDrafts[org.id] ?? ""}
                      onChange={(e) =>
                        setOwnerEmailDrafts((prev) => ({ ...prev, [org.id]: e.target.value }))
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="owner@example.com"
                    />
                    <button
                      onClick={() => handleAssignOwner(org.id)}
                      disabled={busyId === `owner-${org.id}`}
                      className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 shrink-0"
                    >
                      追加
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">クレジットを付与</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      value={grantAmountDrafts[org.id] ?? ""}
                      onChange={(e) =>
                        setGrantAmountDrafts((prev) => ({ ...prev, [org.id]: e.target.value }))
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="例: 50"
                    />
                    <button
                      onClick={() => handleGrantCredits(org.id)}
                      disabled={busyId === `grant-${org.id}`}
                      className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 shrink-0"
                    >
                      付与
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
