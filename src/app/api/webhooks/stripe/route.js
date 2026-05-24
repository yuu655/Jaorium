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
      // DB に「購入済み」を記録
      const supabaseUserId = session.metadata.supabase_user_id;
      const { error } = await supabase
        .from("users")
        .update({ customer_id: session.customer })
        .eq("id", supabaseUserId)
    //   console.log(data, error);
      if (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
          { error: "Failed to update user" },
          { status: 500 },
        );
      }
      break;
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      // DB のサブスク状態を更新
      break;
  }

  return NextResponse.json({ received: true });
}
