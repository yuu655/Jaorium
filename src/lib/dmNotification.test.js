import { describe, it, expect } from "vitest";
import {
  shouldSendDmEmail,
  DM_EMAIL_THROTTLE_MIN,
  DM_ACTIVE_WINDOW_MIN,
} from "./dmNotification";

const now = new Date("2026-10-03T12:00:00Z");
const minutesAgo = (n) => new Date(now.getTime() - n * 60_000).toISOString();

describe("shouldSendDmEmail", () => {
  it("sends when the recipient has never opened the chat", () => {
    expect(
      shouldSendDmEmail({
        lastReadAt: null,
        lastNotifiedAt: null,
        messageCreatedAt: now.toISOString(),
        now,
      }),
    ).toEqual({ send: true, reason: "unread" });
  });

  it("sends when the last read is older than the new message", () => {
    expect(
      shouldSendDmEmail({
        lastReadAt: minutesAgo(90),
        lastNotifiedAt: null,
        messageCreatedAt: now.toISOString(),
        now,
      }),
    ).toEqual({ send: true, reason: "unread" });
  });

  it("skips when an email went out inside the throttle window", () => {
    expect(
      shouldSendDmEmail({
        lastReadAt: minutesAgo(90),
        lastNotifiedAt: minutesAgo(DM_EMAIL_THROTTLE_MIN - 1),
        messageCreatedAt: now.toISOString(),
        now,
      }),
    ).toEqual({ send: false, reason: "throttled" });
  });

  it("sends again once the throttle window has passed", () => {
    expect(
      shouldSendDmEmail({
        lastReadAt: minutesAgo(90),
        lastNotifiedAt: minutesAgo(DM_EMAIL_THROTTLE_MIN + 1),
        messageCreatedAt: now.toISOString(),
        now,
      }),
    ).toEqual({ send: true, reason: "unread" });
  });

  it("skips when the recipient already read past the message", () => {
    expect(
      shouldSendDmEmail({
        lastReadAt: now.toISOString(),
        lastNotifiedAt: null,
        messageCreatedAt: minutesAgo(1),
        now,
      }),
    ).toEqual({ send: false, reason: "already_read" });
  });

  // webhookはINSERT直後に走るので、開いている相手の既読更新が間に合わないことがある
  it("skips when the recipient was reading moments ago", () => {
    expect(
      shouldSendDmEmail({
        lastReadAt: minutesAgo(DM_ACTIVE_WINDOW_MIN - 1),
        lastNotifiedAt: null,
        messageCreatedAt: now.toISOString(),
        now,
      }),
    ).toEqual({ send: false, reason: "recently_active" });
  });

  it("sends once the recipient has been away past the active window", () => {
    expect(
      shouldSendDmEmail({
        lastReadAt: minutesAgo(DM_ACTIVE_WINDOW_MIN + 1),
        lastNotifiedAt: null,
        messageCreatedAt: now.toISOString(),
        now,
      }),
    ).toEqual({ send: true, reason: "unread" });
  });

  it("ignores unparsable timestamps instead of throwing", () => {
    expect(
      shouldSendDmEmail({
        lastReadAt: "not-a-date",
        lastNotifiedAt: "not-a-date",
        messageCreatedAt: undefined,
        now,
      }),
    ).toEqual({ send: true, reason: "unread" });
  });

  // スロットルは既読判定より先に効く（読んでいても読んでいなくても送らない）
  it("throttles even when the message is unread", () => {
    expect(
      shouldSendDmEmail({
        lastReadAt: null,
        lastNotifiedAt: minutesAgo(1),
        messageCreatedAt: now.toISOString(),
        now,
      }),
    ).toEqual({ send: false, reason: "throttled" });
  });
});
