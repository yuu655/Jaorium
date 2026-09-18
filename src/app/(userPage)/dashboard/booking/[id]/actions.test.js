import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/utils/getUrls", () => ({ default: vi.fn(() => "https://www.jaorium.com") }));

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn(async () => ({})) }));
vi.mock("resend", () => ({
  Resend: vi.fn(function Resend() {
    this.emails = { send: sendMock };
  }),
}));

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { submitBooking } from "./actions";

function formData(fields) {
  const map = new Map(Object.entries(fields));
  return { get: (key) => map.get(key) ?? null };
}

// 日時の検証は「今日以降」を要求するので、テストは常に来年の日付を使う
const FUTURE_DATE = `${new Date().getFullYear() + 1}-07-10`;

const validFields = {
  title: "受験相談",
  description: "詳細です",
  date_choices: `${FUTURE_DATE}|13:00`,
  trouble_episode: "つまずいた話",
  actions_taken: "やったこと",
  unresolved_issues: "未解決の課題",
  desired_outcome: "相談したいこと",
};

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  sendMock.mockClear();
});

describe("submitBooking server action", () => {
  it("requires a title", async () => {
    const result = await submitBooking("mentor-1", null, formData({}));

    expect(result).toEqual({ error: "相談内容を選択してください" });
  });

  it("requires authentication", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({ auth: { getUser: vi.fn(async () => ({ data: { user: null } })) } }),
    );

    const result = await submitBooking("mentor-1", null, formData(validFields));

    expect(result).toEqual({ error: "ログインが必要です" });
  });

  it("rejects a caller whose profiles.role isn't \"user\"", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })),
        },
        from: { profiles: () => createChain({ data: { role: "mentor" }, error: null }) },
      }),
    );

    const result = await submitBooking("mentor-1", null, formData(validFields));

    expect(result).toEqual({ error: "権限がありません" });
  });

  // 現行のOTPサインアップではuser_metadata.roleが設定されないため、
  // roleの判定はuser_metadataではなくprofilesテーブルを正とする(回帰テスト)
  it("rejects a caller with no profiles row even if user_metadata claims role user", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({
            data: { user: { id: "u1", user_metadata: { role: "user" } } },
          })),
        },
        from: { profiles: () => createChain({ data: null, error: null }) },
      }),
    );

    const result = await submitBooking("mentor-1", null, formData(validFields));

    expect(result).toEqual({ error: "権限がありません" });
  });

  it("rejects a nonexistent mentor", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })),
        },
        from: {
          profiles: () => createChain({ data: { role: "user" }, error: null }),
          public_mentors: () => createChain({ data: null, error: null }),
        },
      }),
    );

    const result = await submitBooking("mentor-1", null, formData(validFields));

    expect(result).toEqual({ error: "メンターが存在しません" });
  });

  // public_mentorsはadmin_allow/is_allowedで絞ったビュー。mentorsに行が存在しても
  // 未承認ならビューには出ないので、IDを直接POSTしても予約は成立しない
  it("rejects a mentor that exists but is not published (unapproved or suspended)", async () => {
    const meetingsChain = createChain({ data: [{ id: "meeting-1" }], error: null });
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })),
        },
        from: {
          profiles: () => createChain({ data: { role: "user" }, error: null }),
          mentors: () => createChain({ data: { id: "mentor-1" }, error: null }),
          public_mentors: () => createChain({ data: null, error: null }),
          meetings: () => meetingsChain,
        },
      }),
    );

    const result = await submitBooking("mentor-1", null, formData(validFields));

    expect(result).toEqual({ error: "メンターが存在しません" });
    expect(meetingsChain.insert).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns an error when the meeting insert fails, without sending any email", async () => {
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({
        auth: { admin: { getUserById: vi.fn(async () => ({ data: { user: { email: "mentor@example.com" } } })) } },
      }),
    );
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })),
        },
        from: {
          profiles: () => createChain({ data: { role: "user" }, error: null }),
          public_mentors: () => createChain({ data: { id: "mentor-1" }, error: null }),
          meetings: () => createChain({ data: null, error: { message: "insert failed" } }),
        },
      }),
    );

    const result = await submitBooking("mentor-1", null, formData(validFields));

    expect(result).toEqual({ error: "予約の作成に失敗しました" });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("creates the meeting, emails both parties, revalidates both dashboards, and redirects to the chat", async () => {
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({
        auth: { admin: { getUserById: vi.fn(async () => ({ data: { user: { email: "mentor@example.com" } } })) } },
      }),
    );
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({
            data: { user: { id: "u1", email: "user@example.com" } },
          })),
        },
        from: {
          profiles: () => createChain({ data: { role: "user" }, error: null }),
          public_mentors: () => createChain({ data: { id: "mentor-1" }, error: null }),
          meetings: () => createChain({ data: [{ id: "meeting-1" }], error: null }),
        },
      }),
    );

    await expect(submitBooking("mentor-1", null, formData(validFields))).rejects.toThrow(
      "REDIRECT:/dashboard/chat/meeting-1",
    );

    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ to: "mentor@example.com" }));
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ to: "user@example.com" }));
    expect(revalidateTag).toHaveBeenCalledWith("dashboard-user-u1");
    expect(revalidateTag).toHaveBeenCalledWith("dashboard-mentor-mentor-1");
  });
});

describe("submitBooking / 希望日時（第1〜第3希望）", () => {
  // 予約フォームの日程入力は第1希望が必須。第2・第3希望は任意。
  function mockClients({ messagesChain, availability = [], meetings } = {}) {
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({
        auth: {
          admin: {
            getUserById: vi.fn(async () => ({
              data: { user: { email: "mentor@example.com" } },
            })),
          },
        },
        from: {
          mentor_availabilities: () => createChain({ data: availability, error: null }),
          meetings: () => createChain({ data: [], error: null }),
          meeting_schedules: () => createChain({ data: [], error: null }),
        },
      }),
    );
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({
            data: { user: { id: "u1", email: "user@example.com" } },
          })),
        },
        from: {
          profiles: () => createChain({ data: { role: "user" }, error: null }),
          public_mentors: () => createChain({ data: { id: "mentor-1" }, error: null }),
          meetings: () => meetings ?? createChain({ data: [{ id: "meeting-1" }], error: null }),
          messages: () => messagesChain ?? createChain({ error: null }),
        },
      }),
    );
  }

  it("posts the choices as one date_proposal message on the new meeting", async () => {
    const messagesChain = createChain({ error: null });
    mockClients({ messagesChain });

    await expect(
      submitBooking(
        "mentor-1",
        null,
        formData({
          ...validFields,
          date_choices: `${FUTURE_DATE}|13:00,${FUTURE_DATE}|15:00,${FUTURE_DATE}|17:30`,
        }),
      ),
    ).rejects.toThrow("REDIRECT:/dashboard/chat/meeting-1");

    expect(messagesChain.insert).toHaveBeenCalledTimes(1);
    expect(messagesChain.insert).toHaveBeenCalledWith({
      meeting_id: "meeting-1",
      sender_id: "u1",
      content: `${FUTURE_DATE}|13:00,${FUTURE_DATE}|15:00,${FUTURE_DATE}|17:30`,
      type: "date_proposal",
    });
  });

  it("accepts a first choice on its own", async () => {
    const messagesChain = createChain({ error: null });
    mockClients({ messagesChain });

    await expect(
      submitBooking("mentor-1", null, formData(validFields)),
    ).rejects.toThrow("REDIRECT:/dashboard/chat/meeting-1");

    expect(messagesChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ content: `${FUTURE_DATE}|13:00` }),
    );
  });

  it("requires a first choice", async () => {
    const messagesChain = createChain({ error: null });
    mockClients({ messagesChain });

    const result = await submitBooking(
      "mentor-1",
      null,
      formData({ ...validFields, date_choices: "" }),
    );

    expect(result).toEqual({ error: "日時を選択してください" });
    expect(messagesChain.insert).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  // 不正な日時で先に meetings を作ってしまうと、宙に浮いた面談が残る
  it("validates the choices before creating the meeting", async () => {
    const meetingsChain = createChain({ data: [{ id: "meeting-1" }], error: null });
    mockClients({ meetings: meetingsChain });

    const result = await submitBooking(
      "mentor-1",
      null,
      formData({ ...validFields, date_choices: "2020-01-01|13:00" }),
    );

    expect(result).toEqual({
      error: "第1希望の日時は提案できません。空き状況を確認してください",
    });
    expect(meetingsChain.insert).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects a choice outside the mentor's availability", async () => {
    const messagesChain = createChain({ error: null });
    // メンターは 13:00-15:00 しか開けていない
    mockClients({
      messagesChain,
      availability: [{ date: FUTURE_DATE, start_time: "13:00:00", end_time: "15:00:00" }],
    });

    const result = await submitBooking(
      "mentor-1",
      null,
      formData({
        ...validFields,
        date_choices: `${FUTURE_DATE}|13:00,${FUTURE_DATE}|20:00`,
      }),
    );

    expect(result).toEqual({
      error: "第2希望の日時は提案できません。空き状況を確認してください",
    });
    expect(messagesChain.insert).not.toHaveBeenCalled();
  });

  it("rejects duplicate choices", async () => {
    mockClients({});

    const result = await submitBooking(
      "mentor-1",
      null,
      formData({ ...validFields, date_choices: `${FUTURE_DATE}|13:00,${FUTURE_DATE}|13:00` }),
    );

    expect(result).toEqual({ error: "同じ日時は選べません" });
  });

  it("rejects more than three choices", async () => {
    mockClients({});

    const result = await submitBooking(
      "mentor-1",
      null,
      formData({
        ...validFields,
        date_choices: [
          `${FUTURE_DATE}|13:00`,
          `${FUTURE_DATE}|14:00`,
          `${FUTURE_DATE}|15:00`,
          `${FUTURE_DATE}|16:00`,
        ].join(","),
      }),
    );

    expect(result).toEqual({ error: "日時は3つまで選択できます" });
  });

  it("lists the requested dates in the mentor's notification email", async () => {
    mockClients({});

    await expect(
      submitBooking(
        "mentor-1",
        null,
        formData({
          ...validFields,
          date_choices: `${FUTURE_DATE}|13:00,${FUTURE_DATE}|15:00`,
        }),
      ),
    ).rejects.toThrow("REDIRECT:/dashboard/chat/meeting-1");

    const mentorMail = sendMock.mock.calls
      .map(([mail]) => mail)
      .find((mail) => mail.to === "mentor@example.com");

    const year = FUTURE_DATE.slice(0, 4);
    expect(mentorMail.html).toContain(`第1希望: ${year}年7月10日 13:00`);
    expect(mentorMail.html).toContain(`第2希望: ${year}年7月10日 15:00`);
  });

  // 面談自体は作成済みなので、メッセージの失敗で予約をやり直させない
  it("still redirects to the chat when the proposal message fails to insert", async () => {
    mockClients({ messagesChain: createChain({ error: { message: "db" } }) });

    await expect(
      submitBooking("mentor-1", null, formData(validFields)),
    ).rejects.toThrow("REDIRECT:/dashboard/chat/meeting-1");
  });
});
