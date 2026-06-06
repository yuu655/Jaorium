import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export default async function StipeCompletePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: mentor } = await supabase
    .from("mentors")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  // Stripeから最新のアカウント状態を取得して確認
  const account = await stripe.accounts.retrieve(mentor.stripe_account_id);
  const completed = account.details_submitted;

  if (completed) {
    await supabase
      .from("mentors")
      .update({ stripe_onboarding_completed: true })
      .eq("id", user.id);
  }

  return (
    <div>
      {completed ? (
        <p>口座登録が完了しました！</p>
      ) : (
        <p>登録が完了していません。再度お試しください。</p>
      )}
    </div>
  );
}