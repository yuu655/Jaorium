import { describe, it, expect, vi } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/stripe", () => ({
  stripe: { accounts: { create: vi.fn() }, accountLinks: { create: vi.fn() } },
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/utils/getUrls", () => ({ default: vi.fn(() => "https://www.jaorium.com") }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createStripeOnboarding } from "./actions";

describe("createStripeOnboarding server action", () => {
  it("requires authentication", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({ auth: { getUser: vi.fn(async () => ({ data: { user: null } })) } }),
    );

    const result = await createStripeOnboarding();

    expect(result).toEqual({ error: "ログインが必要です" });
    expect(stripe.accounts.create).not.toHaveBeenCalled();
  });

  it("reuses an existing Stripe Connect account instead of creating a new one", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })) },
        from: {
          mentors: () =>
            createChain({
              data: { stripe_account_id: "acct_existing", stripe_onboarding_completed: false },
              error: null,
            }),
        },
      }),
    );
    stripe.accountLinks.create.mockResolvedValue({ url: "https://connect.stripe.com/link-1" });

    await expect(createStripeOnboarding()).rejects.toThrow("REDIRECT:https://connect.stripe.com/link-1");

    expect(stripe.accounts.create).not.toHaveBeenCalled();
    expect(stripe.accountLinks.create).toHaveBeenCalledWith(
      expect.objectContaining({ account: "acct_existing" }),
    );
  });

  it("creates a new Express account and saves it when the mentor has none yet", async () => {
    const mentorsChain = createChain({ error: null });
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })) },
        from: { mentors: () => mentorsChain },
      }),
    );
    mentorsChain.single = vi.fn(async () => ({
      data: { stripe_account_id: null, stripe_onboarding_completed: false },
      error: null,
    }));
    stripe.accounts.create.mockResolvedValue({ id: "acct_new" });
    stripe.accountLinks.create.mockResolvedValue({ url: "https://connect.stripe.com/link-2" });

    await expect(createStripeOnboarding()).rejects.toThrow("REDIRECT:https://connect.stripe.com/link-2");

    expect(stripe.accounts.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "express", country: "JP" }),
    );
    expect(mentorsChain.update).toHaveBeenCalledWith({ stripe_account_id: "acct_new" });
    expect(stripe.accountLinks.create).toHaveBeenCalledWith(
      expect.objectContaining({ account: "acct_new" }),
    );
  });
});
