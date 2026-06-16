"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  IconBuildingBank,
  IconList,
  IconCalculator,
} from "@tabler/icons-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PAYOUT_FEE = 250;
const MIN_PAYOUT_AMOUNT = 1000;

export default function MentorPayout({ currentUserId, session, profile }) {
  const supabase = createClient();
  const [balance, setBalance] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // 残高取得
  useEffect(() => {
    const fetchBalance = async () => {
      const { data } = await supabase
        .from("mentor_balances")
        .select("balance")
        .eq("mentor_id", currentUserId)
        .single();
      if (data) setBalance(data.balance);
    };

    const fetchLogs = async () => {
      const { data } = await supabase
        .from("mentor_balance_logs")
        .select("*")
        .eq("mentor_id", currentUserId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setLogs(data);
    };

    fetchBalance();
    fetchLogs();
  }, [currentUserId]);

  // Realtimeで残高を購読
  useEffect(() => {
    const channel = supabase
      .channel(`mentor_balance:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mentor_balances",
          filter: `mentor_id=eq.${currentUserId}`,
        },
        (payload) => setBalance(payload.new.balance),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mentor_balance_logs",
          filter: `mentor_id=eq.${currentUserId}`,
        },
        (payload) => setLogs((prev) => [payload.new, ...prev]),
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUserId]);

  const handlePayout = async () => {
    setLoading(true);
    setShowDialog(false);

    const res = await fetch("/api/mentor/payout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await res.json();
    setLoading(false);

    if (data.error) {
      alert(data.error);
    }
    // 成功時はRealtimeで自動更新
  };

  const transferAmount = (balance ?? 0) - PAYOUT_FEE;
  const canPayout = (balance ?? 0) >= MIN_PAYOUT_AMOUNT;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  };

  const reasonLabel = (reason) => {
    if (reason === "meeting_completed") return "面談完了";
    if (reason === "payout") return "振込申請";
    return reason;
  };

  return (
    <div className="mx-10 py-10">
      <h3 className="text-2xl font-bold text-center mb-15">支払い</h3>

      <div className="max-w-3xl mx-auto px-4 my-8 sm:px-6 lg:px-8">
        <Link href="/dashboard/mentor/stripe/guide">
          <Button variant="outline" className="w-full">
            { profile.stripe_onboarding_completed ? "Stripe口座を更新" : "Stripe口座登録" }
          </Button>
        </Link>
      </div>

      {profile.stripe_onboarding_completed && (
        <>
          {/* 残高カード */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">振込可能残高</p>
              <p className="text-xl font-medium text-gray-800">
                ¥{(balance ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">累計受取額</p>
              <p className="text-xl font-medium text-gray-500">
                ¥
                {logs
                  .filter((l) => l.change > 0)
                  .reduce((sum, l) => sum + l.change, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>

          {/* 振込内訳 */}
          {canPayout && (
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs font-medium text-gray-400 flex items-center gap-1.5 mb-3">
                <IconCalculator size={13} />
                振込内訳
              </p>
              <div className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100">
                <span className="text-gray-500">振込可能残高</span>
                <span className="font-medium text-gray-800">
                  ¥{(balance ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100">
                <span className="text-gray-500">振込手数料</span>
                <span className="font-medium text-red-500">
                  - ¥{PAYOUT_FEE.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-1.5">
                <span className="text-gray-500">お受け取り額</span>
                <span className="font-medium text-green-600">
                  ¥{transferAmount.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* 振込申請ボタン */}
          <button
            onClick={() => setShowDialog(true)}
            disabled={!canPayout || loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:border disabled:border-gray-200 text-white text-sm font-medium rounded-xl py-3 transition-colors mb-2"
          >
            <IconBuildingBank size={15} />
            {loading
              ? "処理中..."
              : canPayout
                ? "銀行口座へ振込申請する"
                : `残高が不足しています（最低¥${MIN_PAYOUT_AMOUNT.toLocaleString()}）`}
          </button>
          <p className="text-xs text-gray-400 text-center mb-6">
            振込先は登録済みの銀行口座です
          </p>

          {/* 残高履歴 */}
          <div>
            <p className="text-xs font-medium text-gray-400 flex items-center gap-1.5 mb-3">
              <IconList size={13} />
              残高履歴
            </p>
            {logs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                履歴はありません
              </p>
            ) : (
              <div className="flex flex-col">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-none text-sm"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-800">
                        {reasonLabel(log.reason)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                    <span
                      className={`font-medium ${
                        log.change > 0 ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {log.change > 0 ? "+" : ""}¥
                      {Math.abs(log.change).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 確認ダイアログ */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>振込申請の確認</AlertDialogTitle>
            <AlertDialogDescription>
              ¥{transferAmount.toLocaleString()}（手数料¥{PAYOUT_FEE}
              差し引き後）を登録済みの銀行口座に振込申請します。よろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handlePayout}>
              申請する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
