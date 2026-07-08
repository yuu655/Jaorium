import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ stripe: { checkout: { sessions: { create: vi.fn() } } } }));
vi.mock("@/utils/getUrls", () => ({ default: vi.fn(() => "https://www.jaorium.com") }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  confirmDate,
  resetDate,
  sendDateProposal,
  requestFinish,
  approveFinish,
  cancelFinishRequest,
  consumeCredit,
  redirectToCheckout,
} from "./actions";

const meeting = { id: "meeting-1", user: "user-1", mentor: "mentor-1", finish_requested_by: null };

function mockAuthedSupabase({ user = { id: "user-1" }, meetingsResult = { data: meeting, error: null }, extraFrom = {} } = {}) {
  const supabase = createSupabaseMock({
    auth: { getUser: vi.fn(async () => ({ data: { user } })) },
    from: {
      meetings: () => createChain(meetingsResult),
      ...extraFrom,
    },
  });
  createClient.mockResolvedValue(supabase);
  return supabase;
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.stubEnv("NEXT_APIROUTE_SECRET", "route-secret");
  global.fetch = vi.fn(async () => ({ ok: true }));
});

describe("meeting authorization (getMeetingWithAuth), via requestFinish", () => {
  it("requires an authenticated user", async () => {
    mockAuthedSupabase({ user: null });

    const result = await requestFinish("meeting-1");

    expect(result).toEqual({ error: "ログインが必要です" });
  });

  it("rejects a user who is neither the meeting's user nor mentor", async () => {
    mockAuthedSupabase({ user: { id: "someone-else" } });

    const result = await requestFinish("meeting-1");

    expect(result).toEqual({ error: "権限がありません" });
  });

  it("rejects when the meeting does not exist", async () => {
    mockAuthedSupabase({ meetingsResult: { data: null, error: null } });

    const result = await requestFinish("missing-meeting");

    expect(result).toEqual({ error: "権限がありません" });
  });
});

describe("confirmDate", () => {
  it("calls the meeting PATCH API with set_schedule and revalidates both dashboards", async () => {
    mockAuthedSupabase();

    const result = await confirmDate("meeting-1", "2026-07-10", "10:00");

    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://www.jaorium.com/api/meeting/meeting-1",
      expect.objectContaining({
        method: "PATCH",
        headers: { "x-api-key": "route-secret" },
        body: JSON.stringify({ action: "set_schedule", date: "2026-07-10", time: "10:00" }),
      }),
    );
    expect(revalidateTag).toHaveBeenCalledWith("dashboard-user-user-1");
    expect(revalidateTag).toHaveBeenCalledWith("dashboard-mentor-mentor-1");
  });

  it("returns an error when the PATCH API responds with a non-OK status", async () => {
    mockAuthedSupabase();
    global.fetch = vi.fn(async () => ({ ok: false, status: 500, text: async () => "boom" }));

    const result = await confirmDate("meeting-1", "2026-07-10", "10:00");

    expect(result).toEqual({ error: "APIエラー" });
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("resetDate", () => {
  it("calls the meeting PATCH API with delete_schedule", async () => {
    mockAuthedSupabase();

    const result = await resetDate("meeting-1");

    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://www.jaorium.com/api/meeting/meeting-1",
      expect.objectContaining({ body: JSON.stringify({ action: "delete_schedule" }) }),
    );
  });

  it("returns an error when the PATCH API responds with a non-OK status", async () => {
    mockAuthedSupabase();
    global.fetch = vi.fn(async () => ({ ok: false, status: 500, text: async () => "boom" }));

    const result = await resetDate("meeting-1");

    expect(result).toEqual({ error: "APIエラー" });
  });
});

describe("sendDateProposal", () => {
  it("inserts a date_proposal message", async () => {
    const messagesChain = createChain({ error: null });
    mockAuthedSupabase({ extraFrom: { messages: () => messagesChain } });

    const result = await sendDateProposal("meeting-1", "2026-07-10", "10:00");

    expect(result).toEqual({ success: true });
    expect(messagesChain.insert).toHaveBeenCalledWith({
      meeting_id: "meeting-1",
      sender_id: "user-1",
      content: "2026-07-10|10:00",
      type: "date_proposal",
    });
  });

  it("returns an error when the insert fails", async () => {
    mockAuthedSupabase({ extraFrom: { messages: () => createChain({ error: { message: "db" } }) } });

    const result = await sendDateProposal("meeting-1", "2026-07-10", "10:00");

    expect(result).toEqual({ error: "送信に失敗しました" });
  });
});

describe("requestFinish", () => {
  it("records the requester on the meeting", async () => {
    const meetingsWriteChain = createChain({ error: null });
    const supabase = createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
      from: { meetings: () => meetingsWriteChain },
    });
    // getMeetingWithAuth reads via supabase.from("meetings").select(...).single(), and the
    // subsequent update also goes through supabase.from("meetings") - reuse the same chain,
    // whose fixed `single()`/thenable result also has to look like the meeting for the read.
    meetingsWriteChain.select = vi.fn(() => meetingsWriteChain);
    meetingsWriteChain.single = vi.fn(async () => ({ data: meeting, error: null }));
    createClient.mockResolvedValue(supabase);

    const result = await requestFinish("meeting-1");

    expect(result).toEqual({ success: true });
    expect(meetingsWriteChain.update).toHaveBeenCalledWith({ finish_requested_by: "user-1" });
  });
});

describe("approveFinish", () => {
  it("refuses to let the requester approve their own finish request", async () => {
    mockAuthedSupabase({
      user: { id: "user-1" },
      meetingsResult: { data: { ...meeting, finish_requested_by: "user-1" }, error: null },
    });

    const result = await approveFinish("meeting-1");

    expect(result).toEqual({ error: "自分の申請は承認できません" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("finishes the meeting when approved by the other participant", async () => {
    const meetingsChain = createChain({ error: null });
    const supabase = createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })) },
      from: { meetings: () => meetingsChain },
    });
    meetingsChain.select = vi.fn(() => meetingsChain);
    meetingsChain.single = vi.fn(async () => ({
      data: { ...meeting, finish_requested_by: "user-1" },
      error: null,
    }));
    createClient.mockResolvedValue(supabase);

    const result = await approveFinish("meeting-1");

    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://www.jaorium.com/api/meeting/meeting-1",
      expect.objectContaining({ body: JSON.stringify({ action: "finish" }) }),
    );
    expect(meetingsChain.update).toHaveBeenCalledWith({ finish_requested_by: null });
  });

  it("returns an error when the PATCH API responds with a non-OK status, without updating the meeting", async () => {
    const meetingsChain = createChain({ error: null });
    const supabase = createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })) },
      from: { meetings: () => meetingsChain },
    });
    meetingsChain.select = vi.fn(() => meetingsChain);
    meetingsChain.single = vi.fn(async () => ({
      data: { ...meeting, finish_requested_by: "user-1" },
      error: null,
    }));
    createClient.mockResolvedValue(supabase);
    global.fetch = vi.fn(async () => ({ ok: false, status: 500, text: async () => "boom" }));

    const result = await approveFinish("meeting-1");

    expect(result).toEqual({ error: "APIエラー" });
    expect(meetingsChain.update).not.toHaveBeenCalled();
  });
});

describe("cancelFinishRequest", () => {
  it("rejects cancellation by someone who isn't the original requester", async () => {
    mockAuthedSupabase({
      user: { id: "mentor-1" },
      meetingsResult: { data: { ...meeting, finish_requested_by: "user-1" }, error: null },
    });

    const result = await cancelFinishRequest("meeting-1");

    expect(result).toEqual({ error: "権限がありません" });
  });
});

describe("consumeCredit", () => {
  // service role でRPCを呼ぶadminクライアントのモック。meetingsは呼び出し者が
  // user-1本人の面談を返す（参加者チェックを通す）。
  function mockAdminClient({ balance = 3, rpc = vi.fn(async () => ({ error: null })), meetingRow = { id: "meeting-1", user: "user-1", mentor: "mentor-1" } } = {}) {
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({
        rpc,
        from: {
          meetings: () => createChain({ data: meetingRow, error: null }),
          credits: () => createChain({ data: { balance }, error: null }),
        },
      }),
    );
    return rpc;
  }

  it("blocks consumption when the balance is already below 1", async () => {
    mockAdminClient({ balance: 0 });
    createClient.mockResolvedValue({ auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) } });

    const result = await consumeCredit("meeting-1");

    expect(result).toEqual({ error: "INSUFFICIENT_CREDITS" });
  });

  it("rejects when the caller is not the meeting's own user (only the student may consume)", async () => {
    const rpc = mockAdminClient();
    // 面談の user は user-1 だが、ログイン中はメンター。RPCまで到達させない
    createClient.mockResolvedValue({ auth: { getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })) } });

    const result = await consumeCredit("meeting-1");

    expect(result).toEqual({ error: "権限がありません" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects when the meeting does not exist", async () => {
    const rpc = mockAdminClient({ meetingRow: null });
    createClient.mockResolvedValue({ auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) } });

    const result = await consumeCredit("missing-meeting");

    expect(result).toEqual({ error: "権限がありません" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("calls the consume_credit RPC when the caller owns the meeting and balance is sufficient", async () => {
    const rpc = mockAdminClient({ balance: 3 });
    createClient.mockResolvedValue({ auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) } });

    const result = await consumeCredit("meeting-1");

    expect(result).toEqual({ success: true });
    expect(rpc).toHaveBeenCalledWith("consume_credit", { p_user_id: "user-1", p_meeting_id: "meeting-1" });
  });

  it("maps an INSUFFICIENT_CREDITS RPC error to the same sentinel", async () => {
    mockAdminClient({ balance: 3, rpc: vi.fn(async () => ({ error: { message: "INSUFFICIENT_CREDITS: balance too low" } })) });
    createClient.mockResolvedValue({ auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) } });

    const result = await consumeCredit("meeting-1");

    expect(result).toEqual({ error: "INSUFFICIENT_CREDITS" });
  });

  it("requires authentication", async () => {
    createClient.mockResolvedValue({ auth: { getUser: vi.fn(async () => ({ data: { user: null }, error: null })) } });

    const result = await consumeCredit("meeting-1");

    expect(result).toEqual({ error: "ログインが必要です" });
  });
});

describe("redirectToCheckout", () => {
  it("creates a Stripe checkout session for the existing Stripe customer and redirects to it", async () => {
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1", user_metadata: {} } } })) },
      from: () => createChain({ data: { customer_id: "cus_123" }, error: null }),
    });
    stripe.checkout.sessions.create.mockResolvedValue({ url: "https://checkout.stripe.com/session-1" });

    await expect(redirectToCheckout("meeting-1")).rejects.toThrow(
      "REDIRECT:https://checkout.stripe.com/session-1",
    );

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_123", mode: "payment" }),
    );
  });

  it("requires authentication", async () => {
    createClient.mockResolvedValue({ auth: { getUser: vi.fn(async () => ({ data: { user: null } })) } });

    const result = await redirectToCheckout("meeting-1");

    expect(result).toEqual({ error: "ログインが必要です" });
    expect(redirect).not.toHaveBeenCalled();
  });
});
