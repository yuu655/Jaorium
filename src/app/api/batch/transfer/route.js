import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

export async function POST(req) {
  // CRON_SECRETで認証
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_SECRET_KEY
  );

  // 先月の期間を計算
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const period = `${from.getUTCFullYear()}-${String(from.getUTCMonth() + 1).padStart(2, "0")}`;

  // 集計クエリ実行
  const { data: summaries, error } = await supabase.rpc("get_monthly_transfer_summary", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });

  if (error) {
    console.error("Summary query failed:", error);
    return Response.json({ error: "Failed to fetch summary" }, { status: 500 });
  }

  const results = [];

  for (const summary of summaries) {
    // onboarding未完了・金額0はスキップ
    if (!summary.stripe_onboarding_completed) continue;
    if (!summary.stripe_account_id) continue;
    if (summary.transfer_amount <= 0) continue;

    // 二重送金防止：同じperiodのtransferが既にあればスキップ
    const { data: existing } = await supabase
      .from("transfers")
      .select("id")
      .eq("mentor_id", summary.mentor_id)
      .eq("period", period)
      .single();

    if (existing) {
      results.push({ mentor_id: summary.mentor_id, status: "skipped" });
      continue;
    }

    try {
      const transfer = await stripe.transfers.create({
        amount: summary.transfer_amount,
        currency: "jpy",
        destination: summary.stripe_account_id,
        metadata: {
          mentor_id: summary.mentor_id,
          period,
          consultation_count: String(summary.consultation_count),
        },
      });

      await supabase.from("transfers").insert({
        mentor_id: summary.mentor_id,
        stripe_transfer_id: transfer.id,
        period,
        consultation_count: summary.consultation_count,
        amount: summary.transfer_amount,
        status: "completed",
      });

      results.push({ mentor_id: summary.mentor_id, status: "completed", amount: summary.transfer_amount });
    } catch (err) {
      console.error(`Transfer failed for mentor ${summary.mentor_id}:`, err);

      await supabase.from("transfers").insert({
        mentor_id: summary.mentor_id,
        period,
        consultation_count: summary.consultation_count,
        amount: summary.transfer_amount,
        status: "failed",
      });

      results.push({ mentor_id: summary.mentor_id, status: "failed", error: err.message });
    }
  }

  return Response.json({ period, results });
}