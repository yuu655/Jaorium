import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

export default async function StripeCompletePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: mentor } = await supabase
    .from("mentors")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  if (!mentor?.stripe_account_id) {
    redirect("/dashboard/mentor/stripe/guide");
  }

  const account = await stripe.accounts.retrieve(mentor.stripe_account_id);
  const completed = account.details_submitted;

  if (completed) {
    await supabase
      .from("mentors")
      .update({ stripe_onboarding_completed: true })
      .eq("id", user.id);

    // 完了 → メンターダッシュボードへ
    redirect("/dashboard/mentor?onboarding=completed");
  } else {
    // 未完了 → ガイドページに戻す
    redirect("/dashboard/mentor/stripe/refresh");
  }
}