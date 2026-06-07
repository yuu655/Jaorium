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

  // 未送金の月を全て取得
  const { data: unpaidPeriods, error: periodsError } = await supabase.rpc("get_unpaid_periods");

  if (periodsError) {
    console.error("get_unpaid_periods failed:", periodsError);
    return Response.json({ error: "Failed to fetch unpaid periods" }, { status: 500 });
  }

  if (!unpaidPeriods || unpaidPeriods.length === 0) {
    return Response.json({ message: "未送金の月はありません", results: [] });
  }

  const allResults = [];

  for (const { period, from_date, to_date } of unpaidPeriods) {
    // 該当月の集計
    const { data: summaries, error: summaryError } = await supabase.rpc("get_monthly_transfer_summary", {
      p_from: from_date,
      p_to: to_date,
    });

    if (summaryError) {
      console.error(`Summary failed for ${period}:`, summaryError);
      allResults.push({ period, status: "error", error: summaryError.message });
      continue;
    }

    for (const summary of summaries) {
      // onboarding未完了・金額0はスキップ
      if (!summary.stripe_onboarding_completed) continue;
      if (!summary.stripe_account_id) continue;
      if (summary.transfer_amount <= 0) continue;

      // 二重送金防止
      const { data: existing } = await supabase
        .from("transfers")
        .select("id")
        .eq("mentor_id", summary.mentor_id)
        .eq("period", period)
        .single();

      if (existing) {
        allResults.push({ period, mentor_id: summary.mentor_id, status: "skipped" });
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

        allResults.push({
          period,
          mentor_id: summary.mentor_id,
          status: "completed",
          amount: summary.transfer_amount,
        });
      } catch (err) {
        console.error(`Transfer failed for mentor ${summary.mentor_id} period ${period}:`, err);

        await supabase.from("transfers").insert({
          mentor_id: summary.mentor_id,
          period,
          consultation_count: summary.consultation_count,
          amount: summary.transfer_amount,
          status: "failed",
        });

        allResults.push({
          period,
          mentor_id: summary.mentor_id,
          status: "failed",
          error: err.message,
        });
      }
    }
  }

  return Response.json({ results: allResults });
}