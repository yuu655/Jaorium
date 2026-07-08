import { createClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

export default async function StripeCompletePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Stripe連携情報は mentor_secret（本人SELECT可）
  const { data: secret } = await supabase
    .from("mentor_secret")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  if (!secret?.stripe_account_id) {
    redirect("/dashboard/mentor/stripe/guide");
  }

  const account = await stripe.accounts.retrieve(secret.stripe_account_id);
  const completed = account.details_submitted;

  if (completed) {
    // mentor_secret は本人UPDATE不可のため service role で更新
    const admin = createAdminSupabaseClient();
    await admin
      .from("mentor_secret")
      .update({ stripe_onboarding_completed: true })
      .eq("id", user.id);

    // 完了 → メンターダッシュボードへ
    redirect("/dashboard/mentor?onboarding=completed");
  } else {
    // 未完了 → ガイドページに戻す
    redirect("/dashboard/mentor/stripe/refresh");
  }
}
