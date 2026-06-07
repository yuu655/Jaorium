import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import { Resend } from "resend";

const resend = new Resend(process.env.SMTP_API_KEY);

// 再試行可能なStripeエラーコード
const RETRYABLE_ERRORS = ["insufficient_funds", "rate_limit", "api_connection_error"];

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
      if (summary.transfer_amount <= 0) continue;

      // 二重送金防止: completedのみスキップ
      const { data: existing } = await supabase
        .from("transfers")
        .select("id")
        .eq("mentor_id", summary.mentor_id)
        .eq("period", period)
        .eq("status", "completed")
        .single();

      if (existing) {
        allResults.push({ period, mentor_id: summary.mentor_id, status: "skipped" });
        continue;
      }

      // pendingレコードが既にあれば再利用、なければ新規INSERT用にIDを確保
      const { data: pendingRecord } = await supabase
        .from("transfers")
        .select("id")
        .eq("mentor_id", summary.mentor_id)
        .eq("period", period)
        .eq("status", "pending")
        .single();

      // onboarding未完了はpendingで記録してメール送信
      if (!summary.stripe_onboarding_completed || !summary.stripe_account_id) {
        if (!pendingRecord) {
          await supabase.from("transfers").insert({
            mentor_id: summary.mentor_id,
            period,
            consultation_count: summary.consultation_count,
            amount: summary.transfer_amount,
            status: "pending",
            error_reason: "onboarding_incomplete",
          });
        }

        // メンターのメールアドレスと名前を取得
        const { data: userData } = await supabase.auth.admin.getUserById(summary.mentor_id);
        const mentorEmail = userData?.user?.email;

        const { data: mentorData } = await supabase
          .from("mentors")
          .select("name")
          .eq("id", summary.mentor_id)
          .single();
        const mentorName = mentorData?.name ?? "メンター";

        if (mentorEmail) {
          await resend.emails.send({
            from: "noreply@jaorium.com",
            to: mentorEmail,
            subject: "【Jaorium】振込口座の登録・本人確認をお願いします",
            html: `
              <p>${mentorName} 様</p>
              <br />
              <p>
                先月分の報酬振込を処理しましたが、以下のいずれかの理由により振込ができませんでした。
              </p>
              <ul>
                <li>振込口座の登録が完了していない</li>
                <li>本人確認（マイナンバー・身分証明書）が未完了または審査中</li>
              </ul>
              <br />
              <p>以下のリンクから登録状況をご確認いただき、手続きを完了してください。</p>
              <p>
                <a href="https://www.jaorium.com/dashboard/mentor/stripe/guide">
                  口座登録・本人確認はこちら
                </a>
              </p>
              <br />
              <p>手続き完了後、翌月の振込処理にて対応いたします。</p>
              <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
              <br />
              <p>Jaorium運営チーム</p>
            `,
          });
        }

        allResults.push({ period, mentor_id: summary.mentor_id, status: "pending", reason: "onboarding_incomplete" });
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

        // pendingレコードがあれば更新、なければINSERT
        if (pendingRecord) {
          await supabase
            .from("transfers")
            .update({
              stripe_transfer_id: transfer.id,
              status: "completed",
            })
            .eq("id", pendingRecord.id);
        } else {
          await supabase.from("transfers").insert({
            mentor_id: summary.mentor_id,
            stripe_transfer_id: transfer.id,
            period,
            consultation_count: summary.consultation_count,
            amount: summary.transfer_amount,
            status: "completed",
          });
        }

        allResults.push({
          period,
          mentor_id: summary.mentor_id,
          status: "completed",
          amount: summary.transfer_amount,
        });
      } catch (err) {
        console.error(`Transfer failed for mentor ${summary.mentor_id} period ${period}:`, err);

        // 再試行可能なエラーはpending、それ以外はfailed
        const status = RETRYABLE_ERRORS.includes(err.code) ? "pending" : "failed";

        if (pendingRecord) {
          await supabase
            .from("transfers")
            .update({ status, error_reason: err.message })
            .eq("id", pendingRecord.id);
        } else {
          await supabase.from("transfers").insert({
            mentor_id: summary.mentor_id,
            period,
            consultation_count: summary.consultation_count,
            amount: summary.transfer_amount,
            status,
            error_reason: err.message,
          });
        }

        allResults.push({
          period,
          mentor_id: summary.mentor_id,
          status,
          error: err.message,
        });
      }
    }
  }

  return Response.json({ results: allResults });
}