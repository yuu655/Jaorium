import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/stripe", () => ({
  stripe: { transfers: { create: vi.fn() } },
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));
const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn(async () => ({})) }));
vi.mock("resend", () => ({
  Resend: vi.fn(function Resend() {
    this.emails = { send: sendMock };
  }),
}));

import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { POST } from "./route";

function makeRequest(secret = "cron-secret") {
  return { headers: { get: vi.fn(() => (secret ? `Bearer ${secret}` : null)) } };
}

const period = { period: "2026-06", from_date: "2026-06-01", to_date: "2026-06-30" };

function summary(overrides = {}) {
  return {
    mentor_id: "mentor-1",
    transfer_amount: 5000,
    consultation_count: 3,
    stripe_onboarding_completed: true,
    stripe_account_id: "acct_1",
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubEnv("CRON_SECRET", "cron-secret");
  vi.spyOn(console, "error").mockImplementation(() => {});
  sendMock.mockClear();
  stripe.transfers.create.mockReset();
});

describe("POST /api/batch/transfer (cron)", () => {
  it("rejects requests without the correct CRON_SECRET", async () => {
    createClient.mockReturnValue(createSupabaseMock());

    const res = await POST(makeRequest("wrong-secret"));

    expect(res.status).toBe(401);
  });

  it("returns 500 when get_unpaid_periods fails", async () => {
    createClient.mockReturnValue(
      createSupabaseMock({
        rpc: vi.fn(async () => ({ data: null, error: { message: "rpc failed" } })),
      }),
    );

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
  });

  it("reports no unpaid periods when there are none", async () => {
    createClient.mockReturnValue(
      createSupabaseMock({ rpc: vi.fn(async () => ({ data: [], error: null })) }),
    );

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(body).toEqual({ message: "未送金の月はありません", results: [] });
  });

  it("skips a mentor that already has a completed transfer for the period", async () => {
    const rpc = vi.fn(async (fn) => {
      if (fn === "get_unpaid_periods") return { data: [period], error: null };
      if (fn === "get_monthly_transfer_summary") return { data: [summary()], error: null };
      return { data: null, error: null };
    });
    createClient.mockReturnValue(
      createSupabaseMock({
        rpc,
        from: { transfers: () => createChain({ data: { id: "existing" }, error: null }) },
      }),
    );

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(body.results).toEqual([
      { period: "2026-06", mentor_id: "mentor-1", status: "skipped" },
    ]);
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });

  it("records a completed transfer and does not email the mentor when onboarding is done", async () => {
    const rpc = vi.fn(async (fn) => {
      if (fn === "get_unpaid_periods") return { data: [period], error: null };
      if (fn === "get_monthly_transfer_summary") return { data: [summary()], error: null };
      return { data: null, error: null };
    });
    const transfersChain = createChain({ data: null, error: null });
    createClient.mockReturnValue(
      createSupabaseMock({
        rpc,
        from: { transfers: () => transfersChain },
      }),
    );
    stripe.transfers.create.mockResolvedValue({ id: "tr_1" });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(body.results).toEqual([
      { period: "2026-06", mentor_id: "mentor-1", status: "completed", amount: 5000 },
    ]);
    expect(stripe.transfers.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 5000, destination: "acct_1" }),
    );
    expect(transfersChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ mentor_id: "mentor-1", status: "completed" }),
    );
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("records a pending transfer and emails the mentor when Stripe onboarding is incomplete", async () => {
    const rpc = vi.fn(async (fn) => {
      if (fn === "get_unpaid_periods") return { data: [period], error: null };
      if (fn === "get_monthly_transfer_summary") {
        return {
          data: [summary({ stripe_onboarding_completed: false, stripe_account_id: null })],
          error: null,
        };
      }
      return { data: null, error: null };
    });
    const transfersChain = createChain({ data: null, error: null });
    createClient.mockReturnValue(
      createSupabaseMock({
        rpc,
        from: {
          transfers: () => transfersChain,
          mentors: () => createChain({ data: { name: "山田太郎" }, error: null }),
        },
        auth: {
          admin: {
            getUserById: vi.fn(async () => ({ data: { user: { email: "mentor@example.com" } } })),
          },
        },
      }),
    );

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(body.results).toEqual([
      {
        period: "2026-06",
        mentor_id: "mentor-1",
        status: "pending",
        reason: "onboarding_incomplete",
      },
    ]);
    expect(transfersChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending", error_reason: "onboarding_incomplete" }),
    );
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "mentor@example.com" }),
    );
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });

  it("silently skips a summary whose transfer_amount is zero or negative", async () => {
    const rpc = vi.fn(async (fn) => {
      if (fn === "get_unpaid_periods") return { data: [period], error: null };
      if (fn === "get_monthly_transfer_summary") {
        return { data: [summary({ transfer_amount: 0 })], error: null };
      }
      return { data: null, error: null };
    });
    createClient.mockReturnValue(createSupabaseMock({ rpc }));

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(body.results).toEqual([]);
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });
});
