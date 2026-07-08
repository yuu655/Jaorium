import { stripe } from "@/lib/stripe";
import { isRetryableStripeError } from "@/lib/stripeRetry";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

const resend = new Resend(process.env.SMTP_API_KEY);

// ---- 純粋ロジック ----

function isAuthorizedCronRequest(authHeader) {
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

// ---- I/O（Supabase / Stripe / Resend呼び出し） ----

function fetchUnpaidPeriods(supabase) {
  return supabase.rpc("get_unpaid_periods");
}

function fetchMonthlySummaries(supabase, { fromDate, toDate }) {
  return supabase.rpc("get_monthly_transfer_summary", { p_from: fromDate, p_to: toDate });
}

async function findCompletedTransfer(supabase, { mentorId, period }) {
  const { data } = await supabase
    .from("transfers")
    .select("id")
    .eq("mentor_id", mentorId)
    .eq("period", period)
    .eq("status", "completed")
    .single();
  return data;
}

async function findPendingTransfer(supabase, { mentorId, period }) {
  const { data } = await supabase
    .from("transfers")
    .select("id")
    .eq("mentor_id", mentorId)
    .eq("period", period)
    .eq("status", "pending")
    .single();
  return data;
}

async function recordOnboardingIncompletePending(supabase, { mentorId, period, consultationCount, amount }) {
  await supabase.from("transfers").insert({
    mentor_id: mentorId,
    period,
    consultation_count: consultationCount,
    amount,
    status: "pending",
    error_reason: "onboarding_incomplete",
  });
}

async function fetchMentorContact(supabase, mentorId) {
  const { data: userData } = await supabase.auth.admin.getUserById(mentorId);
  const email = userData?.user?.email;

  const { data: mentorData } = await supabase.from("mentors").select("name").eq("id", mentorId).single();
  const name = mentorData?.name ?? "メンター";

  return { email, name };
}

async function sendOnboardingIncompleteEmail({ to, mentorName }) {
  await resend.emails.send({
    from: "noreply@jaorium.com",
    to,
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

async function createMentorTransfer({ amount, destination, mentorId, period, consultationCount }) {
  return stripe.transfers.create({
    amount,
    currency: "jpy",
    destination,
    metadata: {
      mentor_id: mentorId,
      period,
      consultation_count: String(consultationCount),
    },
  });
}

async function recordCompletedTransfer(
  supabase,
  { pendingRecordId, mentorId, period, consultationCount, amount, stripeTransferId },
) {
  if (pendingRecordId) {
    await supabase
      .from("transfers")
      .update({ stripe_transfer_id: stripeTransferId, status: "completed" })
      .eq("id", pendingRecordId);
  } else {
    await supabase.from("transfers").insert({
      mentor_id: mentorId,
      stripe_transfer_id: stripeTransferId,
      period,
      consultation_count: consultationCount,
      amount,
      status: "completed",
    });
  }
}

async function recordFailedTransfer(
  supabase,
  { pendingRecordId, mentorId, period, consultationCount, amount, status, errorMessage },
) {
  if (pendingRecordId) {
    await supabase.from("transfers").update({ status, error_reason: errorMessage }).eq("id", pendingRecordId);
  } else {
    await supabase.from("transfers").insert({
      mentor_id: mentorId,
      period,
      consultation_count: consultationCount,
      amount,
      status,
      error_reason: errorMessage,
    });
  }
}

// ---- 1メンター・1期間ぶんの処理（オーケストレーション） ----

async function handleOnboardingIncomplete(supabase, { period, summary, pendingRecord }) {
  if (!pendingRecord) {
    await recordOnboardingIncompletePending(supabase, {
      mentorId: summary.mentor_id,
      period,
      consultationCount: summary.consultation_count,
      amount: summary.transfer_amount,
    });
  }

  const { email, name } = await fetchMentorContact(supabase, summary.mentor_id);
  if (email) {
    await sendOnboardingIncompleteEmail({ to: email, mentorName: name });
  }

  return { period, mentor_id: summary.mentor_id, status: "pending", reason: "onboarding_incomplete" };
}

async function attemptStripeTransfer(supabase, { period, summary, pendingRecord }) {
  try {
    const transfer = await createMentorTransfer({
      amount: summary.transfer_amount,
      destination: summary.stripe_account_id,
      mentorId: summary.mentor_id,
      period,
      consultationCount: summary.consultation_count,
    });

    await recordCompletedTransfer(supabase, {
      pendingRecordId: pendingRecord?.id,
      mentorId: summary.mentor_id,
      period,
      consultationCount: summary.consultation_count,
      amount: summary.transfer_amount,
      stripeTransferId: transfer.id,
    });

    return {
      period,
      mentor_id: summary.mentor_id,
      status: "completed",
      amount: summary.transfer_amount,
    };
  } catch (err) {
    console.error(`Transfer failed for mentor ${summary.mentor_id} period ${period}:`, err);

    const status = isRetryableStripeError(err.code) ? "pending" : "failed";

    await recordFailedTransfer(supabase, {
      pendingRecordId: pendingRecord?.id,
      mentorId: summary.mentor_id,
      period,
      consultationCount: summary.consultation_count,
      amount: summary.transfer_amount,
      status,
      errorMessage: err.message,
    });

    return { period, mentor_id: summary.mentor_id, status, error: err.message };
  }
}

async function processMentorTransferForPeriod(supabase, { period, summary }) {
  if (summary.transfer_amount <= 0) return null;

  const completedTransfer = await findCompletedTransfer(supabase, { mentorId: summary.mentor_id, period });
  if (completedTransfer) {
    return { period, mentor_id: summary.mentor_id, status: "skipped" };
  }

  const pendingRecord = await findPendingTransfer(supabase, { mentorId: summary.mentor_id, period });

  if (!summary.stripe_onboarding_completed || !summary.stripe_account_id) {
    return handleOnboardingIncomplete(supabase, { period, summary, pendingRecord });
  }

  return attemptStripeTransfer(supabase, { period, summary, pendingRecord });
}

// ---- ハンドラ（オーケストレーション） ----

export async function POST(req) {
  if (!isAuthorizedCronRequest(req.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: unpaidPeriods, error: periodsError } = await fetchUnpaidPeriods(supabase);

  if (periodsError) {
    console.error("get_unpaid_periods failed:", periodsError);
    return Response.json({ error: "Failed to fetch unpaid periods" }, { status: 500 });
  }

  if (!unpaidPeriods || unpaidPeriods.length === 0) {
    return Response.json({ message: "未送金の月はありません", results: [] });
  }

  const allResults = [];

  for (const { period, from_date, to_date } of unpaidPeriods) {
    const { data: summaries, error: summaryError } = await fetchMonthlySummaries(supabase, {
      fromDate: from_date,
      toDate: to_date,
    });

    if (summaryError) {
      console.error(`Summary failed for ${period}:`, summaryError);
      allResults.push({ period, status: "error", error: summaryError.message });
      continue;
    }

    for (const summary of summaries) {
      const result = await processMentorTransferForPeriod(supabase, { period, summary });
      if (result) {
        allResults.push(result);
      }
    }
  }

  return Response.json({ results: allResults });
}
