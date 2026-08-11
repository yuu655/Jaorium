import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminSupabaseClient: vi.fn() }));

const { setVapidDetailsMock, sendNotificationMock } = vi.hoisted(() => ({
  setVapidDetailsMock: vi.fn(),
  sendNotificationMock: vi.fn(async () => ({})),
}));
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: setVapidDetailsMock,
    sendNotification: sendNotificationMock,
  },
}));

import { revalidateTag } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { POST } from "./route";

function makeRequest(body, secret = "webhook-secret") {
  return {
    headers: { get: vi.fn(() => secret) },
    json: vi.fn(async () => body),
  };
}

const meeting = { id: "meeting-1", user: "user-1", mentor: "mentor-1" };

function mockAdminClient({
  meetingRow = meeting,
  senderName = "山田先輩",
  subscriptions = [],
} = {}) {
  const pushChain = createChain({ data: subscriptions, error: null });
  const supabase = createSupabaseMock({
    from: {
      meetings: () => createChain({ data: meetingRow, error: null }),
      users: () => createChain({ data: { name: senderName }, error: null }),
      mentors: () => createChain({ data: { name: senderName }, error: null }),
      push_subscriptions: () => pushChain,
    },
  });
  createAdminSupabaseClient.mockReturnValue(supabase);
  return { supabase, pushChain };
}

beforeEach(() => {
  vi.stubEnv("SUPABASE_WEBHOOK_SECRET", "webhook-secret");
  vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "vapid-public");
  vi.stubEnv("VAPID_PRIVATE_KEY", "vapid-private");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/webhooks/supabase", () => {
  it("rejects a request with the wrong secret", async () => {
    const res = await POST(makeRequest({ table: "mentors" }, "wrong"));

    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("revalidates the mentors tag when the mentors table changes", async () => {
    const res = await POST(makeRequest({ table: "mentors" }));

    expect(revalidateTag).toHaveBeenCalledWith("mentors");
    expect(await res.json()).toEqual({ revalidated: true });
  });

  it("does nothing for an unrecognized table", async () => {
    await POST(makeRequest({ table: "unknown_table" }));

    expect(revalidateTag).not.toHaveBeenCalled();
    expect(sendNotificationMock).not.toHaveBeenCalled();
  });

  it("pushes a DM notification to the counterpart's subscriptions (mentor sends → user receives)", async () => {
    const sub = { id: "sub-1", user_id: "user-1", endpoint: "https://push/ep1", p256dh: "k1", auth: "a1" };
    const { supabase } = mockAdminClient({ subscriptions: [sub] });

    const res = await POST(
      makeRequest({
        table: "messages",
        type: "INSERT",
        record: { id: "m1", meeting_id: "meeting-1", sender_id: "mentor-1", content: "こんにちは", type: "text" },
      }),
    );

    expect(await res.json()).toEqual({ pushed: 1 });
    // 受信者=user-1の購読を引いている
    const pushSelectCall = supabase.from.mock.calls.filter(([t]) => t === "push_subscriptions");
    expect(pushSelectCall.length).toBeGreaterThan(0);
    expect(sendNotificationMock).toHaveBeenCalledWith(
      { endpoint: "https://push/ep1", keys: { p256dh: "k1", auth: "a1" } },
      expect.stringContaining("こんにちは"),
    );
  });

  it("uses a date-proposal specific body for date_proposal messages", async () => {
    const sub = { id: "sub-1", user_id: "mentor-1", endpoint: "https://push/ep1", p256dh: "k1", auth: "a1" };
    mockAdminClient({ subscriptions: [sub] });

    await POST(
      makeRequest({
        table: "messages",
        type: "INSERT",
        record: { id: "m1", meeting_id: "meeting-1", sender_id: "user-1", content: "2026-08-01|10:00", type: "date_proposal" },
      }),
    );

    const payload = JSON.parse(sendNotificationMock.mock.calls[0][1]);
    expect(payload.body).toBe("日時の提案が届きました");
    expect(payload.url).toBe("/dashboard/chat/meeting-1");
  });

  it("sends nothing when the sender is not a participant of the meeting", async () => {
    mockAdminClient({ subscriptions: [{ id: "sub-1" }] });

    const res = await POST(
      makeRequest({
        table: "messages",
        type: "INSERT",
        record: { id: "m1", meeting_id: "meeting-1", sender_id: "someone-else", content: "hi" },
      }),
    );

    expect(await res.json()).toEqual({ pushed: 0 });
    expect(sendNotificationMock).not.toHaveBeenCalled();
  });

  it("sends nothing when the recipient has no subscriptions", async () => {
    mockAdminClient({ subscriptions: [] });

    const res = await POST(
      makeRequest({
        table: "messages",
        type: "INSERT",
        record: { id: "m1", meeting_id: "meeting-1", sender_id: "user-1", content: "hi" },
      }),
    );

    expect(await res.json()).toEqual({ pushed: 0 });
    expect(sendNotificationMock).not.toHaveBeenCalled();
  });

  it("deletes a dead subscription when the push service returns 410 Gone", async () => {
    const sub = { id: "sub-dead", user_id: "user-1", endpoint: "https://push/dead", p256dh: "k", auth: "a" };
    const { pushChain } = mockAdminClient({ subscriptions: [sub] });
    sendNotificationMock.mockRejectedValueOnce({ statusCode: 410 });

    const res = await POST(
      makeRequest({
        table: "messages",
        type: "INSERT",
        record: { id: "m1", meeting_id: "meeting-1", sender_id: "mentor-1", content: "hi" },
      }),
    );

    expect(await res.json()).toEqual({ pushed: 0 });
    expect(pushChain.delete).toHaveBeenCalled();
  });
});
