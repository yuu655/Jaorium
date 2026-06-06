"use server";

import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import getBaseUrl from "@/utils/getUrls";

export async function createStripeOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { data: mentor } = await supabase
    .from("mentors")
    .select("stripe_account_id, stripe_onboarding_completed")
    .eq("id", user.id)
    .single();

  let accountId = mentor?.stripe_account_id;

  // まだConnected Accountがなければ作成
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "JP",
      business_profile: {
        mcc: "8299", // 教育サービスのコード
        url: process.env.NEXT_PUBLIC_URL,
      },
    });
    accountId = account.id;

    await supabase
      .from("mentors")
      .update({ stripe_account_id: accountId })
      .eq("id", user.id);
  }

  // Onboardingリンクを生成
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${getBaseUrl()}/dashboard/mentor/stripe/refresh`,
    return_url: `${getBaseUrl()}/dashboard/mentor/stripe/complete`,
    type: "account_onboarding",
  });

  redirect(accountLink.url);
}
