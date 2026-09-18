import { describe, it, expect } from "vitest";
import {
  groupReadsByMeeting,
  isUnreadMessage,
  countUnreadByMeeting,
  totalUnread,
  formatUnreadBadge,
  isReadByCounterpart,
  lastReadMessageId,
} from "./unreadMessages";

const at = (iso) => `2026-10-03T${iso}:00Z`;

describe("groupReadsByMeeting", () => {
  it("maps meeting id to last_read_at", () => {
    expect(
      groupReadsByMeeting([
        { meeting_id: "m1", last_read_at: at("12:00") },
        { meeting_id: "m2", last_read_at: null },
      ]),
    ).toEqual({ m1: at("12:00"), m2: null });
  });

  it("tolerates null input", () => {
    expect(groupReadsByMeeting(null)).toEqual({});
  });
});

describe("isUnreadMessage", () => {
  const base = { sender_id: "other", created_at: at("12:00"), deleted_at: null };

  it("counts a counterpart message newer than the last read", () => {
    expect(isUnreadMessage(base, { userId: "me", lastReadAt: at("11:00") })).toBe(true);
  });

  it("does not count my own message", () => {
    expect(
      isUnreadMessage({ ...base, sender_id: "me" }, { userId: "me", lastReadAt: at("11:00") }),
    ).toBe(false);
  });

  it("does not count a message already read", () => {
    expect(isUnreadMessage(base, { userId: "me", lastReadAt: at("13:00") })).toBe(false);
  });

  it("counts everything when the chat was never opened", () => {
    expect(isUnreadMessage(base, { userId: "me", lastReadAt: null })).toBe(true);
  });

  it("does not count a deleted message", () => {
    expect(
      isUnreadMessage({ ...base, deleted_at: at("12:30") }, { userId: "me", lastReadAt: null }),
    ).toBe(false);
  });

  // 同時刻は「読んだ」側に倒す（markChatReadは受信後に走る）
  it("treats an exactly-equal timestamp as read", () => {
    expect(isUnreadMessage(base, { userId: "me", lastReadAt: at("12:00") })).toBe(false);
  });
});

describe("countUnreadByMeeting", () => {
  const messages = [
    { meeting_id: "m1", sender_id: "other", created_at: at("12:00") },
    { meeting_id: "m1", sender_id: "other", created_at: at("12:30") },
    { meeting_id: "m1", sender_id: "me", created_at: at("12:40") },
    { meeting_id: "m2", sender_id: "other", created_at: at("09:00") },
  ];

  it("counts per meeting and drops meetings with nothing unread", () => {
    expect(
      countUnreadByMeeting({
        messages,
        readsByMeeting: { m1: at("11:00"), m2: at("10:00") },
        userId: "me",
      }),
    ).toEqual({ m1: 2 });
  });

  it("counts every counterpart message when nothing was ever read", () => {
    expect(countUnreadByMeeting({ messages, readsByMeeting: {}, userId: "me" })).toEqual({
      m1: 2,
      m2: 1,
    });
  });

  it("returns an empty map for no messages", () => {
    expect(countUnreadByMeeting({ messages: [], userId: "me" })).toEqual({});
    expect(countUnreadByMeeting({ messages: null, userId: "me" })).toEqual({});
  });
});

describe("totalUnread", () => {
  it("sums the per-meeting counts", () => {
    expect(totalUnread({ m1: 2, m2: 3 })).toBe(5);
    expect(totalUnread({})).toBe(0);
    expect(totalUnread(undefined)).toBe(0);
  });
});

describe("formatUnreadBadge", () => {
  it("hides the badge at zero", () => {
    expect(formatUnreadBadge(0)).toBeNull();
    expect(formatUnreadBadge(undefined)).toBeNull();
  });

  it("caps at 99+", () => {
    expect(formatUnreadBadge(1)).toBe("1");
    expect(formatUnreadBadge(99)).toBe("99");
    expect(formatUnreadBadge(100)).toBe("99+");
  });
});

describe("isReadByCounterpart", () => {
  const message = { created_at: at("12:00") };

  it("is read when the counterpart looked after it arrived", () => {
    expect(isReadByCounterpart(message, at("12:01"))).toBe(true);
    expect(isReadByCounterpart(message, at("12:00"))).toBe(true);
  });

  it("is unread when the counterpart looked earlier", () => {
    expect(isReadByCounterpart(message, at("11:59"))).toBe(false);
  });

  it("is unread when the counterpart never opened the chat", () => {
    expect(isReadByCounterpart(message, null)).toBe(false);
  });
});

describe("lastReadMessageId", () => {
  const messages = [
    { id: "a", sender_id: "me", created_at: at("12:00") },
    { id: "b", sender_id: "other", created_at: at("12:05") },
    { id: "c", sender_id: "me", created_at: at("12:10") },
    { id: "d", sender_id: "me", created_at: at("12:20") },
  ];

  it("marks my newest message once the counterpart has read everything", () => {
    expect(lastReadMessageId({ messages, userId: "me", counterpartReadAt: at("12:30") })).toBe("d");
  });

  // 読まれた後に送った分はまだ未読。既読マークは読まれた最後の1通に残る
  it("marks the last read one when a newer message is still unread", () => {
    expect(lastReadMessageId({ messages, userId: "me", counterpartReadAt: at("12:15") })).toBe("c");
  });

  it("marks nothing when the counterpart has not read any of mine", () => {
    expect(lastReadMessageId({ messages, userId: "me", counterpartReadAt: at("11:00") })).toBeNull();
    expect(lastReadMessageId({ messages, userId: "me", counterpartReadAt: null })).toBeNull();
  });

  it("never marks the counterpart's own messages", () => {
    expect(
      lastReadMessageId({
        messages: [{ id: "b", sender_id: "other", created_at: at("12:05") }],
        userId: "me",
        counterpartReadAt: at("12:30"),
      }),
    ).toBeNull();
  });

  it("handles an empty thread", () => {
    expect(lastReadMessageId({ messages: [], userId: "me", counterpartReadAt: at("12:30") })).toBeNull();
  });
});
