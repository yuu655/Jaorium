"use server";

import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import getBaseUrl from "@/utils/getUrls";

async function fetchMentorStripeInfo(supabase, userId) {
  const { data } = await supabase
    .from("mentors")
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

async function saveMentorStripeAccountId(supabase, { userId, accountId }) {
  return supabase.from("mentors").update({ stripe_account_id: accountId }).eq("id", userId);
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

    await saveMentorStripeAccountId(supabase, { userId: user.id, accountId });
  }

  // Onboardingリンクを生成
  const accountLink = await createOnboardingLink(accountId);

  redirect(accountLink.url);
}
