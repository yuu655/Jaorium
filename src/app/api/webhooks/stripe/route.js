import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const UNIQUE_VIOLATION = "23505";

function parseWebhookEvent(body, signature) {
  return stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
}

async function updateCustomerId(supabase, { userId, customerId }) {
  return supabase.from("users").update({ customer_id: customerId }).eq("id", userId);
}

async function recordPayment(supabase, payment) {
  return supabase.from("payments").insert(payment).select().single();
}

async function recordCreditLog(supabase, log) {
  return supabase.from("credit_logs").insert(log);
}

async function handleCheckoutSessionCompleted(supabase, session) {
  const userId = session.metadata.supabase_user_id;
  const creditsGranted = parseInt(session.metadata.credits_granted ?? "1");

  // ① users.customer_idを更新（既存処理）
  const { error: userError } = await updateCustomerId(supabase, {
    userId,
    customerId: session.customer,
  });

  if (userError) {
    console.error("Error updating user:", userError);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }

  // ② paymentsにINSERT
  const { data: payment, error: paymentError } = await recordPayment(supabase, {
    user_id: userId,
    stripe_payment_intent_id: session.payment_intent,
    amount: session.amount_total,
    credits_granted: creditsGranted,
    status: "succeeded",
  });

  if (paymentError) {
    // 同一payment_intentのUNIQUE違反 = 処理済みイベントの再送。
    // credit_logsへの二重付与を避けつつ200を返し、Stripeのリトライを止める。
    if (paymentError.code === UNIQUE_VIOLATION) {
      console.log(`Duplicate webhook event ignored: payment_intent=${session.payment_intent}`);
      return null;
    }
    console.error("Error inserting payment:", paymentError);
    return NextResponse.json({ error: "Failed to insert payment" }, { status: 500 });
  }

  // ③ credit_logsにINSERT（トリガーがcreditsのbalanceを自動更新）
  const { error: creditLogError } = await recordCreditLog(supabase, {
    user_id: userId,
    change: creditsGranted,
    reason: "payment",
    payment_id: payment.id,
  });

  if (creditLogError) {
    console.error("Error inserting credit log:", creditLogError);
    return NextResponse.json({ error: "Failed to insert credit log" }, { status: 500 });
  }

  return null;
}

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  const supabase = createAdminSupabaseClient();

  let event;
  try {
    event = parseWebhookEvent(body, sig);
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const errorResponse = await handleCheckoutSessionCompleted(supabase, event.data.object);
      if (errorResponse) return errorResponse;
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      break;
  }

  return NextResponse.json({ received: true });
}
