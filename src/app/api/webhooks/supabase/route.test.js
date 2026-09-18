import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminSupabaseClient: vi.fn() }));

const { setVapidDetailsMock, sendNotificationMock } = vi.hoisted(() => ({
  setVapidDetailsMock: vi.fn(),
  sendNotificationMock: vi.fn(async () => ({})),
}));
const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn(async () => ({})) }));
vi.mock("resend", () => ({
  Resend: vi.fn(function Resend() {
    this.emails = { send: sendMock };
  }),
}));
vi.mock("@/utils/getUrls", () => ({ default: vi.fn(() => "https://www.jaorium.com") }));

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
  recipientEmail = null,
  meetingRead = null,
} = {}) {
  const pushChain = createChain({ data: subscriptions, error: null });
  const readsChain = createChain({ data: meetingRead, error: null });
  const supabase = createSupabaseMock({
    auth: {
      admin: {
        getUserById: vi.fn(async () => ({
          data: { user: recipientEmail ? { email: recipientEmail } : null },
        })),
      },
    },
    from: {
      meetings: () => createChain({ data: meetingRow, error: null }),
      users: () => createChain({ data: { name: senderName }, error: null }),
      mentors: () => createChain({ data: { name: senderName }, error: null }),
      push_subscriptions: () => pushChain,
      meeting_reads: () => readsChain,
    },
  });
  createAdminSupabaseClient.mockReturnValue(supabase);
  return { supabase, pushChain, readsChain };
}

beforeEach(() => {
  sendMock.mockClear();
  vi.stubEnv("SMTP_API_KEY", "resend-key");
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

    expect(await res.json()).toEqual({ pushed: 1, mailed: false });
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

    expect(await res.json()).toEqual({ pushed: 0, mailed: false });
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

    expect(await res.json()).toEqual({ pushed: 0, mailed: false });
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

    expect(await res.json()).toEqual({ pushed: 0, mailed: false });
    expect(pushChain.delete).toHaveBeenCalled();
  });
});

describe("DM通知メール", () => {
  function messageRequest(record) {
    return makeRequest({
      table: "messages",
      type: "INSERT",
      record: { id: "m1", meeting_id: "meeting-1", sender_id: "user-1", ...record },
    });
  }

  it("emails the counterpart when a message is inserted", async () => {
    mockAdminClient({ recipientEmail: "mentor@example.com" });

    const res = await POST(messageRequest({ content: "こんにちは", type: null }));

    expect(await res.json()).toEqual({ pushed: 0, mailed: true });
    expect(sendMock).toHaveBeenCalledTimes(1);
    const mail = sendMock.mock.calls[0][0];
    expect(mail.to).toBe("mentor@example.com");
    expect(mail.subject).toBe("山田先輩さんからメッセージが届きました");
    expect(mail.html).toContain("こんにちは");
    expect(mail.html).toContain("https://www.jaorium.com/dashboard/chat/meeting-1");
  });

  it("lists every choice for a date_proposal message", async () => {
    mockAdminClient({ recipientEmail: "mentor@example.com" });

    const res = await POST(
      messageRequest({
        content: "2099-10-03|13:00,2099-10-05|15:30",
        type: "date_proposal",
      }),
    );

    expect(await res.json()).toEqual({ pushed: 0, mailed: true });
    const mail = sendMock.mock.calls[0][0];
    expect(mail.subject).toBe("山田先輩さんから日時の提案が届きました");
    expect(mail.html).toContain("第1希望: 2099年10月3日 13:00");
    expect(mail.html).toContain("第2希望: 2099年10月5日 15:30");
  });

  // 受信箱でタグとして解釈されないよう、本文は必ずエスケープする
  it("escapes HTML in the message body", async () => {
    mockAdminClient({ recipientEmail: "mentor@example.com" });

    await POST(messageRequest({ content: "<script>alert(1)</script>", type: null }));

    const mail = sendMock.mock.calls[0][0];
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });

  it("skips the email when the recipient has no address", async () => {
    mockAdminClient({ recipientEmail: null });

    const res = await POST(messageRequest({ content: "hi", type: null }));

    expect(await res.json()).toEqual({ pushed: 0, mailed: false });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("does not email when the sender is not a participant", async () => {
    mockAdminClient({ recipientEmail: "mentor@example.com" });

    const res = await POST(
      makeRequest({
        table: "messages",
        type: "INSERT",
        record: { id: "m1", meeting_id: "meeting-1", sender_id: "stranger", content: "hi" },
      }),
    );

    expect(await res.json()).toEqual({ pushed: 0, mailed: false });
    expect(sendMock).not.toHaveBeenCalled();
  });

  // メールが落ちてもPushは送るし、webhookは200で返す（Supabaseの再送を防ぐ）
  it("still returns 200 when the email provider throws", async () => {
    mockAdminClient({ recipientEmail: "mentor@example.com" });
    sendMock.mockRejectedValueOnce(new Error("resend down"));

    const res = await POST(messageRequest({ content: "hi", type: null }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ pushed: 0, mailed: false });
  });
});

describe("DM通知メールの間引き", () => {
  const minutesAgo = (n) => new Date(Date.now() - n * 60_000).toISOString();

  function messageRequest(record) {
    return makeRequest({
      table: "messages",
      type: "INSERT",
      record: {
        id: "m1",
        meeting_id: "meeting-1",
        sender_id: "user-1",
        content: "hi",
        created_at: new Date().toISOString(),
        ...record,
      },
    });
  }

  it("skips the email when one went out in the last 30 minutes", async () => {
    mockAdminClient({
      recipientEmail: "mentor@example.com",
      meetingRead: { last_read_at: minutesAgo(120), last_notified_at: minutesAgo(5) },
    });

    const res = await POST(messageRequest({}));

    expect(await res.json()).toEqual({ pushed: 0, mailed: false });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends once the 30-minute window has passed", async () => {
    mockAdminClient({
      recipientEmail: "mentor@example.com",
      meetingRead: { last_read_at: minutesAgo(120), last_notified_at: minutesAgo(31) },
    });

    const res = await POST(messageRequest({}));

    expect(await res.json()).toEqual({ pushed: 0, mailed: true });
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("skips the email while the recipient has the chat open", async () => {
    mockAdminClient({
      recipientEmail: "mentor@example.com",
      meetingRead: { last_read_at: new Date().toISOString(), last_notified_at: null },
    });

    const res = await POST(messageRequest({ created_at: minutesAgo(1) }));

    expect(await res.json()).toEqual({ pushed: 0, mailed: false });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends when the recipient has been away and was never notified", async () => {
    mockAdminClient({
      recipientEmail: "mentor@example.com",
      meetingRead: { last_read_at: minutesAgo(120), last_notified_at: null },
    });

    const res = await POST(messageRequest({}));

    expect(await res.json()).toEqual({ pushed: 0, mailed: true });
  });

  it("records the send so the next message is throttled", async () => {
    const { readsChain } = mockAdminClient({
      recipientEmail: "mentor@example.com",
      meetingRead: null,
    });

    await POST(messageRequest({}));

    expect(readsChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ meeting_id: "meeting-1", user_id: "mentor-1" }),
      { onConflict: "meeting_id,user_id" },
    );
  });

  // Web Pushは即時性のある通知なので、メールを間引いても止めない
  it("still sends the push when the email is throttled", async () => {
    mockAdminClient({
      recipientEmail: "mentor@example.com",
      subscriptions: [{ id: "s1", endpoint: "https://push/1", p256dh: "p", auth: "a" }],
      meetingRead: { last_read_at: minutesAgo(120), last_notified_at: minutesAgo(5) },
    });

    const res = await POST(messageRequest({}));

    expect(await res.json()).toEqual({ pushed: 1, mailed: false });
    expect(sendNotificationMock).toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });
});
