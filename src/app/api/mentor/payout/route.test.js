import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/stripe", () => ({
  stripe: { transfers: { create: vi.fn() } },
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { POST } from "./route";

function makeRequest(token = "token-123") {
  return {
    headers: { get: vi.fn(() => (token ? `Bearer ${token}` : null)) },
  };
}

function baseSupabase({
  user = { id: "mentor-1" },
  mentor = { stripe_account_id: "acct_1", stripe_onboarding_completed: true },
  balance = { balance: 5000 },
  transfersChain = createChain({ data: { id: "transfer-1" }, error: null }),
  balanceLogsChain = createChain({ error: null }),
} = {}) {
  return createSupabaseMock({
    auth: {
      getUser: vi.fn(async () => ({ data: { user }, error: user ? null : { message: "no user" } })),
    },
    from: {
      mentors: () => createChain({ data: mentor, error: mentor ? null : { message: "not found" } }),
      mentor_balances: () => createChain({ data: balance, error: balance ? null : { message: "not found" } }),
      transfers: () => transfersChain,
      mentor_balance_logs: () => balanceLogsChain,
    },
  });
}

describe("POST /api/mentor/payout", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stripe.transfers.create.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    const supabase = baseSupabase({ user: null });
    createClient.mockReturnValue(supabase);

    const res = await POST(makeRequest());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "ログインが必要です" });
  });

  it("rejects when Stripe onboarding is not completed", async () => {
    const supabase = baseSupabase({
      mentor: { stripe_account_id: null, stripe_onboarding_completed: false },
    });
    createClient.mockReturnValue(supabase);

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "口座登録が完了していません" });
  });

  it("rejects when balance is below the minimum payout amount", async () => {
    const supabase = baseSupabase({ balance: { balance: 999 } });
    createClient.mockReturnValue(supabase);

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("最低振込金額");
  });

  it("claims a processing row, transfers with an idempotency key, then completes the row and logs the consumption", async () => {
    const transfersChain = createChain({ data: { id: "transfer-1" }, error: null });
    const balanceLogsChain = createChain({ error: null });
    const supabase = baseSupabase({
      balance: { balance: 5000 },
      transfersChain,
      balanceLogsChain,
    });
    createClient.mockReturnValue(supabase);
    stripe.transfers.create.mockResolvedValue({ id: "tr_stripe_1" });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, amount: 4750 });

    // ① 送金前に status=processing の行を確保している
    expect(transfersChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        mentor_id: "mentor-1",
        amount: 4750,
        payout_fee: 250,
        status: "processing",
      }),
    );
    // ② Stripe送金は確保した行のIDをidempotencyKeyとして実行される
    expect(stripe.transfers.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 4750, currency: "jpy", destination: "acct_1" }),
      { idempotencyKey: "transfer-1" },
    );
    // ③ 成功後、同じ行が completed に更新される
    expect(transfersChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_transfer_id: "tr_stripe_1", status: "completed" }),
    );
    expect(balanceLogsChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ change: -5000, reason: "payout", transfer_id: "transfer-1" }),
    );
  });

  it("rejects a concurrent payout with 409 when another processing row already exists (unique violation)", async () => {
    const transfersChain = createChain({ data: null, error: { code: "23505", message: "duplicate" } });
    const supabase = baseSupabase({ transfersChain });
    createClient.mockReturnValue(supabase);

    const res = await POST(makeRequest());

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("振込処理が進行中");
    // 排他に負けた側はStripeに一切触れない
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });

  it("returns 500 when claiming the processing row fails for any other reason", async () => {
    const transfersChain = createChain({ data: null, error: { code: "XX000", message: "db down" } });
    const supabase = baseSupabase({ transfersChain });
    createClient.mockReturnValue(supabase);

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });

  it("marks the processing row as pending when Stripe returns a retryable error code", async () => {
    const transfersChain = createChain({ data: { id: "transfer-1" }, error: null });
    const supabase = baseSupabase({ transfersChain });
    createClient.mockReturnValue(supabase);
    const stripeError = Object.assign(new Error("insufficient funds"), { code: "insufficient_funds" });
    stripe.transfers.create.mockRejectedValue(stripeError);

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "振込に失敗しました" });
    expect(transfersChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending", error_reason: "insufficient funds" }),
    );
  });

  it("marks the processing row as failed for a non-retryable error", async () => {
    const transfersChain = createChain({ data: { id: "transfer-1" }, error: null });
    const supabase = baseSupabase({ transfersChain });
    createClient.mockReturnValue(supabase);
    const stripeError = Object.assign(new Error("account closed"), { code: "account_closed" });
    stripe.transfers.create.mockRejectedValue(stripeError);

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
    expect(transfersChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed", error_reason: "account closed" }),
    );
  });
});
