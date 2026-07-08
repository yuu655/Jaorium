"use server";

import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import getBaseUrl from "@/utils/getUrls";

async function fetchMentorStripeInfo(supabase, userId) {
  // mentor_secret は本人SELECT可（本人セッションで読める）
  const { data } = await supabase
    .from("mentor_secret")
    .select("stripe_account_id, stripe_onboarding_completed")
    .eq("id", userId)
    .single();
  return data;
}

async function createExpressAccount() {
  return stripe.accounts.create({
    type: "express",
    country: "JP",
    business_profile: {
      mcc: "8299", // 教育サービスのコード
      url: process.env.NEXT_PUBLIC_URL,
    },
  });
}

// mentor_secret は本人UPDATE不可（admin_allow/transfer_rate保護のため）。
// Stripe列の更新は service role 経由で行う。
async function saveMentorStripeAccountId({ userId, accountId }) {
  const admin = createAdminSupabaseClient();
  return admin.from("mentor_secret").update({ stripe_account_id: accountId }).eq("id", userId);
}

async function createOnboardingLink(accountId) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${getBaseUrl()}/dashboard/mentor/stripe/refresh`,
    return_url: `${getBaseUrl()}/dashboard/mentor/stripe/complete`,
    type: "account_onboarding",
  });
}

export async function createStripeOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const mentor = await fetchMentorStripeInfo(supabase, user.id);
  let accountId = mentor?.stripe_account_id;

  // まだConnected Accountがなければ作成
  if (!accountId) {
    const account = await createExpressAccount();
    accountId = account.id;

    await saveMentorStripeAccountId({ userId: user.id, accountId });
  }

  // Onboardingリンクを生成
  const accountLink = await createOnboardingLink(accountId);

  redirect(accountLink.url);
}
