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
  deleteMessage,
  markChatRead,
} from "./actions";

const meeting = { id: "meeting-1", user: "user-1", mentor: "mentor-1", finish_requested_by: null };

// 日時の検証は「今日以降」を要求するので、テストは常に来年の日付を使う
const FUTURE_DATE = `${new Date().getFullYear() + 1}-07-10`;

// 面談可能日時・他面談の確定枠を引くadminクライアント（service role）のモック
function mockScheduleAdminClient({ availability = [], mentorMeetings = [], schedules = [] } = {}) {
  createSupabaseClient.mockReturnValue(
    createSupabaseMock({
      from: {
        mentor_availabilities: () => createChain({ data: availability, error: null }),
        meetings: () => createChain({ data: mentorMeetings, error: null }),
        meeting_schedules: () => createChain({ data: schedules, error: null }),
      },
    }),
  );
}

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
  // 既定は「空き時間の登録なし・他の面談なし」
  mockScheduleAdminClient();
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

    const result = await confirmDate("meeting-1", FUTURE_DATE, "10:00");

    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://www.jaorium.com/api/meeting/meeting-1",
      expect.objectContaining({
        method: "PATCH",
        headers: { "x-api-key": "route-secret" },
        body: JSON.stringify({ action: "set_schedule", date: FUTURE_DATE, time: "10:00" }),
      }),
    );
    expect(revalidateTag).toHaveBeenCalledWith("dashboard-user-user-1");
    expect(revalidateTag).toHaveBeenCalledWith("dashboard-mentor-mentor-1");
  });

  it("returns an error when the PATCH API responds with a non-OK status", async () => {
    mockAuthedSupabase();
    global.fetch = vi.fn(async () => ({ ok: false, status: 500, text: async () => "boom" }));

    const result = await confirmDate("meeting-1", FUTURE_DATE, "10:00");

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

    const result = await sendDateProposal("meeting-1", [{ date: FUTURE_DATE, time: "10:00" }]);

    expect(result).toEqual({ success: true });
    expect(messagesChain.insert).toHaveBeenCalledWith({
      meeting_id: "meeting-1",
      sender_id: "user-1",
      content: `${FUTURE_DATE}|10:00`,
      type: "date_proposal",
    });
  });

  it("sends three choices as one comma-joined message", async () => {
    const messagesChain = createChain({ error: null });
    mockAuthedSupabase({ extraFrom: { messages: () => messagesChain } });

    const result = await sendDateProposal("meeting-1", [
      { date: FUTURE_DATE, time: "10:00" },
      { date: FUTURE_DATE, time: "13:00" },
      { date: FUTURE_DATE, time: "15:30" },
    ]);

    expect(result).toEqual({ success: true });
    expect(messagesChain.insert).toHaveBeenCalledTimes(1);
    expect(messagesChain.insert).toHaveBeenCalledWith({
      meeting_id: "meeting-1",
      sender_id: "user-1",
      content: `${FUTURE_DATE}|10:00,${FUTURE_DATE}|13:00,${FUTURE_DATE}|15:30`,
      type: "date_proposal",
    });
  });

  it("accepts a second choice without a third", async () => {
    const messagesChain = createChain({ error: null });
    mockAuthedSupabase({ extraFrom: { messages: () => messagesChain } });

    const result = await sendDateProposal("meeting-1", [
      { date: FUTURE_DATE, time: "10:00" },
      { date: FUTURE_DATE, time: "13:00" },
    ]);

    expect(result).toEqual({ success: true });
    expect(messagesChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ content: `${FUTURE_DATE}|10:00,${FUTURE_DATE}|13:00` }),
    );
  });

  it("rejects an empty choice list", async () => {
    const messagesChain = createChain({ error: null });
    mockAuthedSupabase({ extraFrom: { messages: () => messagesChain } });

    expect(await sendDateProposal("meeting-1", [])).toEqual({
      error: "日時を選択してください",
    });
    expect(await sendDateProposal("meeting-1", undefined)).toEqual({
      error: "日時を選択してください",
    });
    expect(messagesChain.insert).not.toHaveBeenCalled();
  });

  it("rejects more than three choices", async () => {
    const messagesChain = createChain({ error: null });
    mockAuthedSupabase({ extraFrom: { messages: () => messagesChain } });

    const result = await sendDateProposal("meeting-1", [
      { date: FUTURE_DATE, time: "10:00" },
      { date: FUTURE_DATE, time: "13:00" },
      { date: FUTURE_DATE, time: "15:30" },
      { date: FUTURE_DATE, time: "17:00" },
    ]);

    expect(result).toEqual({ error: "日時は3つまで選択できます" });
    expect(messagesChain.insert).not.toHaveBeenCalled();
  });

  it("rejects duplicate choices", async () => {
    const messagesChain = createChain({ error: null });
    mockAuthedSupabase({ extraFrom: { messages: () => messagesChain } });

    const result = await sendDateProposal("meeting-1", [
      { date: FUTURE_DATE, time: "10:00" },
      { date: FUTURE_DATE, time: "10:00" },
    ]);

    expect(result).toEqual({ error: "同じ日時は選べません" });
    expect(messagesChain.insert).not.toHaveBeenCalled();
  });

  it("returns an error when the insert fails", async () => {
    mockAuthedSupabase({ extraFrom: { messages: () => createChain({ error: { message: "db" } }) } });

    const result = await sendDateProposal("meeting-1", [{ date: FUTURE_DATE, time: "10:00" }]);

    expect(result).toEqual({ error: "送信に失敗しました" });
  });
});

describe("sendDateProposal / mentor availability", () => {
  // メンターが 13:00-15:00 を開けている状態
  const availability = [{ date: FUTURE_DATE, start_time: "13:00:00", end_time: "15:00:00" }];

  function setup({ availability: rows = [], schedules = [], user = { id: "user-1" } } = {}) {
    const messagesChain = createChain({ error: null });
    mockAuthedSupabase({ user, extraFrom: { messages: () => messagesChain } });
    mockScheduleAdminClient({
      availability: rows,
      mentorMeetings: [{ id: "meeting-1" }, { id: "meeting-2" }],
      schedules,
    });
    return messagesChain;
  }

  it("accepts a slot inside the mentor's availability", async () => {
    const messagesChain = setup({ availability });

    const result = await sendDateProposal("meeting-1", [{ date: FUTURE_DATE, time: "13:30" }]);

    expect(result).toEqual({ success: true });
    expect(messagesChain.insert).toHaveBeenCalled();
  });

  it("rejects a slot outside the mentor's availability", async () => {
    const messagesChain = setup({ availability });

    const result = await sendDateProposal("meeting-1", [{ date: FUTURE_DATE, time: "16:00" }]);

    expect(result).toEqual({
      error: "第1希望の日時は提案できません。空き状況を確認してください",
    });
    expect(messagesChain.insert).not.toHaveBeenCalled();
  });

  it("names which choice fell outside the mentor's availability", async () => {
    const messagesChain = setup({ availability });

    const result = await sendDateProposal("meeting-1", [
      { date: FUTURE_DATE, time: "13:00" },
      { date: FUTURE_DATE, time: "13:30" },
      { date: FUTURE_DATE, time: "16:00" },
    ]);

    expect(result).toEqual({
      error: "第3希望の日時は提案できません。空き状況を確認してください",
    });
    expect(messagesChain.insert).not.toHaveBeenCalled();
  });

  it("rejects a date the mentor did not open at all", async () => {
    setup({ availability });

    const result = await sendDateProposal("meeting-1", [{ date: `${FUTURE_DATE.slice(0, 8)}11`, time: "13:00" }]);

    expect(result.error).toBeDefined();
  });

  it("falls back to free proposals when the mentor set no availability", async () => {
    const messagesChain = setup({ availability: [] });

    const result = await sendDateProposal("meeting-1", [{ date: FUTURE_DATE, time: "20:00" }]);

    expect(result).toEqual({ success: true });
    expect(messagesChain.insert).toHaveBeenCalled();
  });

  it("enforces 30-minute slots even without availability", async () => {
    const messagesChain = setup({ availability: [] });

    const result = await sendDateProposal("meeting-1", [{ date: FUTURE_DATE, time: "13:15" }]);

    expect(result.error).toBeDefined();
    expect(messagesChain.insert).not.toHaveBeenCalled();
  });

  it("rejects past dates", async () => {
    const messagesChain = setup({ availability: [] });

    const result = await sendDateProposal("meeting-1", [{ date: "2020-01-01", time: "13:00" }]);

    expect(result.error).toBeDefined();
    expect(messagesChain.insert).not.toHaveBeenCalled();
  });

  it("lets the mentor propose outside their own availability", async () => {
    const messagesChain = setup({ availability, user: { id: "mentor-1" } });

    const result = await sendDateProposal("meeting-1", [{ date: FUTURE_DATE, time: "20:00" }]);

    expect(result).toEqual({ success: true });
    expect(messagesChain.insert).toHaveBeenCalled();
  });

  it("falls back to free proposals once the last registered slot has passed", async () => {
    // JST 18:00 時点で、その日の 10:00-12:00 しか登録が残っていない状態
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-03T09:00:00Z"));
    const messagesChain = setup({
      availability: [{ date: "2026-10-03", start_time: "10:00:00", end_time: "12:00:00" }],
    });

    const result = await sendDateProposal("meeting-1", [{ date: "2026-10-03", time: "20:00" }]);

    expect(result).toEqual({ success: true });
    expect(messagesChain.insert).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("stays restricted while a slot is still ahead today", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-03T09:00:00Z")); // JST 18:00
    const messagesChain = setup({
      availability: [{ date: "2026-10-03", start_time: "19:00:00", end_time: "21:00:00" }],
    });

    expect(await sendDateProposal("meeting-1", [{ date: "2026-10-03", time: "19:30" }])).toEqual({ success: true });
    // 帯の外なので弾かれる
    expect((await sendDateProposal("meeting-1", [{ date: "2026-10-03", time: "13:00" }])).error).toBeDefined();
    // 帯の中でも、すでに過ぎた時間は提案できない
    expect(messagesChain.insert).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("rejects a slot that has already started today", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-03T09:00:00Z")); // JST 18:00
    const messagesChain = setup({
      availability: [{ date: "2026-10-03", start_time: "17:00:00", end_time: "21:00:00" }],
    });

    const result = await sendDateProposal("meeting-1", [{ date: "2026-10-03", time: "17:30" }]);

    expect(result.error).toBeDefined();
    expect(messagesChain.insert).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("hides slots overlapping the mentor's other confirmed meeting", async () => {
    // 別の面談が 13:00 で確定済み → 60分面談なので 13:30 も使えない
    const messagesChain = setup({
      availability,
      schedules: [{ date: FUTURE_DATE, time: "13:00" }],
    });

    const result = await sendDateProposal("meeting-1", [{ date: FUTURE_DATE, time: "13:30" }]);

    expect(result.error).toBeDefined();
    expect(messagesChain.insert).not.toHaveBeenCalled();
  });

  it("still allows a slot that only touches another confirmed meeting", async () => {
    const messagesChain = setup({
      availability,
      schedules: [{ date: FUTURE_DATE, time: "13:00" }],
    });

    const result = await sendDateProposal("meeting-1", [{ date: FUTURE_DATE, time: "14:00" }]);

    expect(result).toEqual({ success: true });
    expect(messagesChain.insert).toHaveBeenCalled();
  });
});

describe("confirmDate / double booking", () => {
  it("rejects a slot another meeting of the same mentor already took", async () => {
    mockAuthedSupabase();
    mockScheduleAdminClient({
      mentorMeetings: [{ id: "meeting-1" }, { id: "meeting-2" }],
      schedules: [{ date: FUTURE_DATE, time: "13:00" }],
    });

    const result = await confirmDate("meeting-1", FUTURE_DATE, "13:30");

    expect(result).toEqual({
      error: "その日時は別の面談と重なっています。別の日時を提案してください",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does not check the availability bands (the mentor may propose outside them)", async () => {
    mockAuthedSupabase();
    mockScheduleAdminClient({
      availability: [{ date: FUTURE_DATE, start_time: "13:00:00", end_time: "15:00:00" }],
    });

    const result = await confirmDate("meeting-1", FUTURE_DATE, "20:00");

    expect(result).toEqual({ success: true });
  });

  it("rejects off-grid times and past dates", async () => {
    mockAuthedSupabase();

    expect(await confirmDate("meeting-1", FUTURE_DATE, "13:15")).toEqual({
      error: "その日時では確定できません",
    });
    expect(await confirmDate("meeting-1", "2020-01-01", "13:00")).toEqual({
      error: "その日時では確定できません",
    });
    expect(global.fetch).not.toHaveBeenCalled();
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

describe("consumeCredit — organization branching", () => {
  function mockAdminClientWithOrg({
    organizationId = "org-1",
    orgBalance = 3,
    memberLimit = null,
    rpc = vi.fn(async () => ({ error: null })),
    meetingRow = { id: "meeting-1", user: "user-1", mentor: "mentor-1" },
  } = {}) {
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({
        rpc,
        from: {
          meetings: () => createChain({ data: meetingRow, error: null }),
          organization_members: () =>
            createChain({ data: { organization_id: organizationId }, error: null }),
          organization_credits: () => createChain({ data: { balance: orgBalance }, error: null }),
          // 非メンバー用の個人credits取得が誤って呼ばれていないか確認するため、
          // 呼ばれたら分かるようエラーを返しておく
          credits: () => createChain({ data: null, error: { message: "should not be queried" } }),
        },
      }),
    );
    return rpc;
  }

  it("calls consume_organization_credit (not consume_credit) for an active org member", async () => {
    const rpc = mockAdminClientWithOrg({ organizationId: "org-1", orgBalance: 5 });
    createClient.mockResolvedValue({ auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) } });

    const result = await consumeCredit("meeting-1");

    expect(result).toEqual({ success: true });
    expect(rpc).toHaveBeenCalledWith("consume_organization_credit", {
      p_organization_id: "org-1",
      p_user_id: "user-1",
      p_meeting_id: "meeting-1",
    });
  });

  it("blocks consumption when the org balance is 0, without touching personal credits", async () => {
    const rpc = mockAdminClientWithOrg({ orgBalance: 0 });
    createClient.mockResolvedValue({ auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) } });

    const result = await consumeCredit("meeting-1");

    expect(result).toEqual({ error: "INSUFFICIENT_CREDITS" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps a MEMBER_CREDIT_LIMIT_REACHED RPC error to its own sentinel", async () => {
    mockAdminClientWithOrg({
      orgBalance: 5,
      rpc: vi.fn(async () => ({ error: { message: "MEMBER_CREDIT_LIMIT_REACHED" } })),
    });
    createClient.mockResolvedValue({ auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) } });

    const result = await consumeCredit("meeting-1");

    expect(result).toEqual({ error: "MEMBER_CREDIT_LIMIT_REACHED" });
  });

  it("falls back to the personal credit path unchanged when the caller has no active org membership", async () => {
    const rpc = vi.fn(async () => ({ error: null }));
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({
        rpc,
        from: {
          meetings: () => createChain({ data: { id: "meeting-1", user: "user-1", mentor: "mentor-1" }, error: null }),
          organization_members: () => createChain({ data: null, error: null }),
          credits: () => createChain({ data: { balance: 2 }, error: null }),
        },
      }),
    );
    createClient.mockResolvedValue({ auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) } });

    const result = await consumeCredit("meeting-1");

    expect(result).toEqual({ success: true });
    expect(rpc).toHaveBeenCalledWith("consume_credit", { p_user_id: "user-1", p_meeting_id: "meeting-1" });
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

describe("deleteMessage", () => {
  // 送信者検証をJS側で行うadminクライアント（RLSをバイパスする）のモック
  function mockAdminMessages(messageRow) {
    const chain = createChain({ data: messageRow, error: null });
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({ from: { messages: () => chain } }),
    );
    return chain;
  }

  function mockLoggedIn(user) {
    createClient.mockResolvedValue({ auth: { getUser: vi.fn(async () => ({ data: { user } })) } });
  }

  it("soft-deletes the caller's own message", async () => {
    const chain = mockAdminMessages({ id: "msg-1", sender_id: "user-1", deleted_at: null });
    mockLoggedIn({ id: "user-1" });

    const result = await deleteMessage("msg-1");

    expect(result).toEqual({ success: true });
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) }),
    );
    expect(chain.eq).toHaveBeenCalledWith("id", "msg-1");
  });

  it("refuses to delete someone else's message", async () => {
    const chain = mockAdminMessages({ id: "msg-1", sender_id: "user-1", deleted_at: null });
    mockLoggedIn({ id: "mentor-1" });

    const result = await deleteMessage("msg-1");

    expect(result).toEqual({ error: "権限がありません" });
    expect(chain.update).not.toHaveBeenCalled();
  });

  it("requires authentication", async () => {
    const chain = mockAdminMessages({ id: "msg-1", sender_id: "user-1", deleted_at: null });
    mockLoggedIn(null);

    const result = await deleteMessage("msg-1");

    expect(result).toEqual({ error: "ログインが必要です" });
    expect(chain.update).not.toHaveBeenCalled();
  });

  it("rejects when the message does not exist", async () => {
    const chain = mockAdminMessages(null);
    mockLoggedIn({ id: "user-1" });

    const result = await deleteMessage("missing");

    expect(result).toEqual({ error: "権限がありません" });
    expect(chain.update).not.toHaveBeenCalled();
  });

  it("is a no-op when the message is already deleted", async () => {
    const chain = mockAdminMessages({
      id: "msg-1",
      sender_id: "user-1",
      deleted_at: "2026-09-01T00:00:00Z",
    });
    mockLoggedIn({ id: "user-1" });

    const result = await deleteMessage("msg-1");

    expect(result).toEqual({ success: true });
    expect(chain.update).not.toHaveBeenCalled();
  });
});

describe("markChatRead", () => {
  it("upserts the caller's last_read_at for the meeting", async () => {
    const readsChain = createChain({ error: null });
    mockAuthedSupabase({ extraFrom: { meeting_reads: () => readsChain } });

    const result = await markChatRead("meeting-1");

    expect(result).toEqual({ success: true });
    expect(readsChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ meeting_id: "meeting-1", user_id: "user-1" }),
      { onConflict: "meeting_id,user_id" },
    );
    // last_notified_at はwebhook（service role）だけが書く
    expect(readsChain.upsert.mock.calls[0][0]).not.toHaveProperty("last_notified_at");
  });

  it("requires an authenticated user", async () => {
    mockAuthedSupabase({ user: null });

    expect(await markChatRead("meeting-1")).toEqual({ error: "ログインが必要です" });
  });

  it("rejects someone who is not a participant", async () => {
    const readsChain = createChain({ error: null });
    mockAuthedSupabase({
      user: { id: "someone-else" },
      extraFrom: { meeting_reads: () => readsChain },
    });

    expect(await markChatRead("meeting-1")).toEqual({ error: "権限がありません" });
    expect(readsChain.upsert).not.toHaveBeenCalled();
  });

  it("reports a failed upsert without throwing", async () => {
    mockAuthedSupabase({
      extraFrom: { meeting_reads: () => createChain({ error: { message: "db" } }) },
    });

    expect(await markChatRead("meeting-1")).toEqual({ error: "既読の更新に失敗しました" });
  });
});
