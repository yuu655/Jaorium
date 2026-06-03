import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_SECRET_KEY,
  );

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      const supabaseUserId = session.metadata.supabase_user_id;
      const creditsGranted = parseInt(session.metadata.credits_granted ?? "1");

      // ① users.customer_idを更新（既存処理）
      const { error: userError } = await supabase
        .from("users")
        .update({ customer_id: session.customer })
        .eq("id", supabaseUserId);

      if (userError) {
        console.error("Error updating user:", userError);
        return NextResponse.json(
          { error: "Failed to update user" },
          { status: 500 },
        );
      }

      // ② paymentsにINSERT
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: supabaseUserId,
          stripe_payment_intent_id: session.payment_intent,
          amount: session.amount_total,
          credits_granted: creditsGranted,
          status: "succeeded",
        })
        .select()
        .single();

      if (paymentError) {
        console.error("Error inserting payment:", paymentError);
        return NextResponse.json(
          { error: "Failed to insert payment" },
          { status: 500 },
        );
      }

      // ③ credit_logsにINSERT（トリガーがcreditsのbalanceを自動更新）
      const { error: creditLogError } = await supabase
        .from("credit_logs")
        .insert({
          user_id: supabaseUserId,
          change: creditsGranted,
          reason: "payment",
          payment_id: payment.id,
        });

      if (creditLogError) {
        console.error("Error inserting credit log:", creditLogError);
        return NextResponse.json(
          { error: "Failed to insert credit log" },
          { status: 500 },
        );
      }

      break;

    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      break;
  }

  return NextResponse.json({ received: true });
}