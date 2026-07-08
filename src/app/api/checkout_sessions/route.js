import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

async function fetchStripeCustomerId(supabase, userId) {
  const { data } = await supabase.from("users").select("*").eq("id", userId).single();
  return data?.customer_id ?? null;
}

function buildCreditCheckoutParams({ customerId, user, origin }) {
  return {
    ...(customerId
      ? { customer: customerId }
      : {
          customer_email: user.user_metadata.email,
          customer_creation: "always",
        }),
    line_items: [
      {
        // Provide the exact Price ID (for example, price_1234) of the product you want to sell
        price: "price_1TZOHlRbUCCpa1iAiLdVGIRj",
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      supabase_user_id: user.id,
      credits_granted: 1,
    },
    success_url: `${origin}/dashboard/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/account?canceled=true`,
  };
}

export async function POST() {
  try {
    const headersList = await headers();
    const origin = headersList.get("origin");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const customerId = await fetchStripeCustomerId(supabase, user.id);

    // Create Checkout Sessions from body params.
    const session = await stripe.checkout.sessions.create(
      buildCreditCheckoutParams({ customerId, user, origin }),
    );
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: err.statusCode || 500 },
    );
  }
}
