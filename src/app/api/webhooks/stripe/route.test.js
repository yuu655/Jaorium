import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/stripe", () => ({
  stripe: { webhooks: { constructEvent: vi.fn() } },
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { POST } from "./route";

function makeRequest({ body = "{}", signature = "sig_test" } = {}) {
  return {
    text: vi.fn(async () => body),
    headers: { get: vi.fn(() => signature) },
  };
}

function checkoutCompletedEvent(overrides = {}) {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        customer: "cus_123",
        payment_intent: "pi_123",
        amount_total: 1000,
        metadata: { supabase_user_id: "user-1", credits_granted: "3" },
        ...overrides,
      },
    },
  };
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns 400 when the Stripe signature is invalid", async () => {
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });
    createClient.mockReturnValue(createSupabaseMock());

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid signature" });
  });

  it("grants credits on checkout.session.completed: updates customer_id, inserts payment, inserts credit_log", async () => {
    stripe.webhooks.constructEvent.mockReturnValue(checkoutCompletedEvent());

    const usersChain = createChain({ error: null });
    const paymentChain = createChain({ data: { id: "payment-1" }, error: null });
    const creditLogChain = createChain({ error: null });

    const supabase = createSupabaseMock({
      from: {
        users: () => usersChain,
        payments: () => paymentChain,
        credit_logs: () => creditLogChain,
      },
    });
    createClient.mockReturnValue(supabase);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });

    expect(supabase.from).toHaveBeenCalledWith("users");
    expect(usersChain.update).toHaveBeenCalledWith({ customer_id: "cus_123" });
    expect(usersChain.eq).toHaveBeenCalledWith("id", "user-1");

    expect(paymentChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        stripe_payment_intent_id: "pi_123",
        amount: 1000,
        credits_granted: 3,
        status: "succeeded",
      }),
    );

    expect(creditLogChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        change: 3,
        reason: "payment",
        payment_id: "payment-1",
      }),
    );
  });

  it("defaults credits_granted to 1 when metadata omits it", async () => {
    stripe.webhooks.constructEvent.mockReturnValue(
      checkoutCompletedEvent({ metadata: { supabase_user_id: "user-1" } }),
    );

    const paymentChain = createChain({ data: { id: "payment-1" }, error: null });
    const creditLogChain = createChain({ error: null });
    const supabase = createSupabaseMock({
      from: {
        users: () => createChain({ error: null }),
        payments: () => paymentChain,
        credit_logs: () => creditLogChain,
      },
    });
    createClient.mockReturnValue(supabase);

    await POST(makeRequest());

    expect(paymentChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ credits_granted: 1 }),
    );
    expect(creditLogChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ change: 1 }),
    );
  });

  it("returns 500 and stops before inserting a payment if users.update fails", async () => {
    stripe.webhooks.constructEvent.mockReturnValue(checkoutCompletedEvent());

    const paymentChain = createChain({ data: { id: "payment-1" }, error: null });
    const supabase = createSupabaseMock({
      from: {
        users: () => createChain({ error: { message: "db down" } }),
        payments: () => paymentChain,
      },
    });
    createClient.mockReturnValue(supabase);

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to update user" });
    expect(paymentChain.insert).not.toHaveBeenCalled();
  });

  it("returns 500 if the payment insert fails, without inserting a credit log", async () => {
    stripe.webhooks.constructEvent.mockReturnValue(checkoutCompletedEvent());

    const creditLogChain = createChain({ error: null });
    const supabase = createSupabaseMock({
      from: {
        users: () => createChain({ error: null }),
        payments: () => createChain({ data: null, error: { message: "insert failed" } }),
        credit_logs: () => creditLogChain,
      },
    });
    createClient.mockReturnValue(supabase);

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to insert payment" });
    expect(creditLogChain.insert).not.toHaveBeenCalled();
  });

  it("returns 500 if the credit_log insert fails", async () => {
    stripe.webhooks.constructEvent.mockReturnValue(checkoutCompletedEvent());

    const supabase = createSupabaseMock({
      from: {
        users: () => createChain({ error: null }),
        payments: () => createChain({ data: { id: "payment-1" }, error: null }),
        credit_logs: () => createChain({ error: { message: "insert failed" } }),
      },
    });
    createClient.mockReturnValue(supabase);

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to insert credit log" });
  });

  it("acknowledges unhandled event types without touching the database", async () => {
    stripe.webhooks.constructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: { object: {} },
    });
    const supabase = createSupabaseMock();
    createClient.mockReturnValue(supabase);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
