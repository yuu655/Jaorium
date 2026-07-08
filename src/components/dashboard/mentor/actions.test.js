import { describe, it, expect, vi } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/stripe", () => ({
  stripe: { accounts: { create: vi.fn() }, accountLinks: { create: vi.fn() } },
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("@/utils/getUrls", () => ({ default: vi.fn(() => "https://www.jaorium.com") }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createStripeOnboarding } from "./actions";

// 本人セッション（mentor_secret を本人SELECT）で stripe 連携状態を返すクライアント
function mockSessionClient({ user = { id: "mentor-1" }, secret } = {}) {
  createClient.mockResolvedValue(
    createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user } })) },
      from: { mentor_secret: () => createChain({ data: secret, error: null }) },
    }),
  );
}

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
    mockSessionClient({ secret: { stripe_account_id: "acct_existing", stripe_onboarding_completed: false } });
    stripe.accountLinks.create.mockResolvedValue({ url: "https://connect.stripe.com/link-1" });

    await expect(createStripeOnboarding()).rejects.toThrow("REDIRECT:https://connect.stripe.com/link-1");

    expect(stripe.accounts.create).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled(); // 既存アカウントなので保存もしない
    expect(stripe.accountLinks.create).toHaveBeenCalledWith(
      expect.objectContaining({ account: "acct_existing" }),
    );
  });

  it("creates a new Express account and saves the id via the service-role client (mentor_secret)", async () => {
    mockSessionClient({ secret: { stripe_account_id: null, stripe_onboarding_completed: false } });

    const secretChain = createChain({ error: null });
    createAdminClient.mockReturnValue(
      createSupabaseMock({ from: { mentor_secret: () => secretChain } }),
    );

    stripe.accounts.create.mockResolvedValue({ id: "acct_new" });
    stripe.accountLinks.create.mockResolvedValue({ url: "https://connect.stripe.com/link-2" });

    await expect(createStripeOnboarding()).rejects.toThrow("REDIRECT:https://connect.stripe.com/link-2");

    expect(stripe.accounts.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "express", country: "JP" }),
    );
    // 保存は service role の mentor_secret 更新で行われる（本人UPDATE不可のため）
    expect(secretChain.update).toHaveBeenCalledWith({ stripe_account_id: "acct_new" });
    expect(secretChain.eq).toHaveBeenCalledWith("id", "mentor-1");
    expect(stripe.accountLinks.create).toHaveBeenCalledWith(
      expect.objectContaining({ account: "acct_new" }),
    );
  });
});
