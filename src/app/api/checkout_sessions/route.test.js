import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/stripe", () => ({ stripe: { checkout: { sessions: { create: vi.fn() } } } }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: () => "https://www.jaorium.com" })),
}));

import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { POST } from "./route";

describe("POST /api/checkout_sessions", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("creates a checkout session for an existing Stripe customer and redirects to it", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1", user_metadata: {} } } })) },
        from: { users: () => createChain({ data: { customer_id: "cus_123" }, error: null }) },
      }),
    );
    stripe.checkout.sessions.create.mockResolvedValue({ url: "https://checkout.stripe.com/session-1" });

    const res = await POST();

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("https://checkout.stripe.com/session-1");
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_123",
        success_url: "https://www.jaorium.com/dashboard/success?session_id={CHECKOUT_SESSION_ID}",
      }),
    );
  });

  it("falls back to customer_email when the user has no Stripe customer yet", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({
            data: { user: { id: "user-1", user_metadata: { email: "a@example.com" } } },
          })),
        },
        from: { users: () => createChain({ data: null, error: null }) },
      }),
    );
    stripe.checkout.sessions.create.mockResolvedValue({ url: "https://checkout.stripe.com/session-2" });

    await POST();

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer_email: "a@example.com", customer_creation: "always" }),
    );
  });

  it("rejects unauthenticated requests with 401 instead of crashing", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({ auth: { getUser: vi.fn(async () => ({ data: { user: null } })) } }),
    );

    const res = await POST();

    expect(res.status).toBe(401);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("returns a 500 with the error message when Stripe itself throws", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1", user_metadata: {} } } })) },
        from: { users: () => createChain({ data: { customer_id: "cus_123" }, error: null }) },
      }),
    );
    stripe.checkout.sessions.create.mockRejectedValue(new Error("stripe down"));

    const res = await POST();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "stripe down" });
  });
});
