import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { createClient } from "@/lib/supabase/server";
import { submitUser, submitMentor } from "./actions";

function formData(fields) {
  const map = new Map(Object.entries(fields));
  const getAll = (key) => (map.get(key) instanceof Array ? map.get(key) : []);
  return { get: (key) => map.get(key) ?? null, getAll };
}

const userFields = {
  name: "受験生太郎",
  grade: "高3",
  desire: "東京大学",
  password: "secret1",
  password_check: "secret1",
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("submitUser server action", () => {
  it("returns a form error (not a throw) when passwords don't match, before touching Supabase", async () => {
    createClient.mockResolvedValue({ auth: {}, from: vi.fn() });

    const result = await submitUser(
      null,
      formData({ ...userFields, password_check: "different" }),
    );

    expect(result).toEqual({ error: "再入力のパスワードと一致しません。" });
  });

  it("returns a form error when the password is shorter than 6 characters", async () => {
    createClient.mockResolvedValue({ auth: {}, from: vi.fn() });

    const result = await submitUser(
      null,
      formData({ ...userFields, password: "abc", password_check: "abc" }),
    );

    expect(result).toEqual({ error: "パスワードは6文字以上で入力してください。" });
  });

  it("returns a form error when the profiles update fails", async () => {
    const supabase = createSupabaseMock({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
        updateUser: vi.fn(async () => ({ error: null })),
      },
      from: {
        users: () => createChain({ error: null }),
        profiles: () => createChain({ error: { message: "profiles update failed" } }),
      },
    });
    createClient.mockResolvedValue(supabase);

    const result = await submitUser(null, formData(userFields));

    expect(result).toEqual({ error: "登録に失敗しました。もう一度お試しください。" });
  });

  it("sets password+role, upserts the user row, marks the profile set last, and redirects", async () => {
    const updateUser = vi.fn(async () => ({ error: null }));
    const usersChain = createChain({ error: null });
    const profilesChain = createChain({ error: null });
    const supabase = createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })), updateUser },
      from: {
        profiles: () => profilesChain,
        users: () => usersChain,
      },
    });
    createClient.mockResolvedValue(supabase);

    await expect(submitUser(null, formData(userFields))).rejects.toThrow(
      "REDIRECT:/setAccount/user/icon",
    );

    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ password: "secret1", data: { role: "user" } }),
    );
    expect(usersChain.upsert).toHaveBeenCalledWith([
      expect.objectContaining({ id: "user-1", name: "受験生太郎", grade: "高3", desire: "東京大学" }),
    ]);
    expect(profilesChain.update).toHaveBeenCalledWith({ set: true });
  });

  // 2026-07-15の登録失敗の一因: パスワードリセット直後に同じパスワードで
  // setAccountを送信すると "same password" エラーで詰まっていた
  it("continues (updating only the role) when the password is the same as the current one", async () => {
    const updateUser = vi
      .fn()
      .mockResolvedValueOnce({
        error: { message: "New password should be different from the old password." },
      })
      .mockResolvedValueOnce({ error: null });
    const supabase = createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })), updateUser },
      from: {
        profiles: () => createChain({ error: null }),
        users: () => createChain({ error: null }),
      },
    });
    createClient.mockResolvedValue(supabase);

    await expect(submitUser(null, formData(userFields))).rejects.toThrow(
      "REDIRECT:/setAccount/user/icon",
    );

    expect(updateUser).toHaveBeenNthCalledWith(1, {
      password: "secret1",
      data: { role: "user" },
    });
    expect(updateUser).toHaveBeenNthCalledWith(2, { data: { role: "user" } });
  });

  it("returns a friendly error when the password update fails for another reason", async () => {
    const supabase = createSupabaseMock({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
        updateUser: vi.fn(async () => ({ error: { message: "Password should be at least 6 characters." } })),
      },
    });
    createClient.mockResolvedValue(supabase);

    const result = await submitUser(null, formData(userFields));

    expect(result).toEqual({
      error: "パスワードの設定に失敗しました。別のパスワードでお試しください。",
    });
  });

  // Googleログイン等ではパスワード欄がフォームに存在しない（nullで届く）
  it("skips the password entirely and only sets the role when no password fields are posted", async () => {
    const updateUser = vi.fn(async () => ({ error: null }));
    const supabase = createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })), updateUser },
      from: {
        profiles: () => createChain({ error: null }),
        users: () => createChain({ error: null }),
      },
    });
    createClient.mockResolvedValue(supabase);

    await expect(
      submitUser(null, formData({ name: "受験生太郎", grade: "高3", desire: "" })),
    ).rejects.toThrow("REDIRECT:/setAccount/user/icon");

    expect(updateUser).toHaveBeenCalledTimes(1);
    expect(updateUser).toHaveBeenCalledWith({ data: { role: "user" } });
  });
});

const mentorFields = {
  name: "先輩花子",
  university: "京都大学",
  faculty: "工学部",
  bio: "よろしくお願いします",
  region: "関西",
  quote: "頑張ろう",
  tagIds: ["tag-1", "tag-2"],
  password: "secret1",
  password_check: "secret1",
};

describe("submitMentor server action", () => {
  it("returns a form error when passwords don't match", async () => {
    createClient.mockResolvedValue({ auth: {}, from: vi.fn() });

    const result = await submitMentor(
      null,
      formData({ ...mentorFields, password_check: "different" }),
    );

    expect(result).toEqual({ error: "再入力のパスワードと一致しません。" });
  });

  it("upserts mentor + mentor_tags, marks the profile set last, and redirects on success", async () => {
    const mentorsChain = createChain({ error: null });
    const mentorTagsChain = createChain({ error: null });
    const profilesChain = createChain({ error: null });
    const supabase = createSupabaseMock({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })),
        updateUser: vi.fn(async () => ({ error: null })),
      },
      from: {
        profiles: () => profilesChain,
        mentors: () => mentorsChain,
        mentor_tags: () => mentorTagsChain,
      },
    });
    createClient.mockResolvedValue(supabase);

    await expect(submitMentor(null, formData(mentorFields))).rejects.toThrow(
      "REDIRECT:/setAccount/mentor/icon",
    );

    expect(mentorsChain.upsert).toHaveBeenCalledWith([
      expect.objectContaining({ id: "mentor-1", name: "先輩花子", university: "京都大学" }),
    ]);
    expect(mentorTagsChain.upsert).toHaveBeenCalledWith(
      [
        { mentor_id: "mentor-1", tag_id: "tag-1" },
        { mentor_id: "mentor-1", tag_id: "tag-2" },
      ],
      { ignoreDuplicates: true },
    );
    expect(profilesChain.update).toHaveBeenCalledWith({ set: true });
  });

  // 回帰テスト: この行が長らくコメントアウトされており、メンターのパスワードも
  // user_metadata.roleも設定されないままオンボーディングが完了してしまっていた
  it("sets the mentor's password and role=mentor on the auth user", async () => {
    const updateUser = vi.fn(async () => ({ error: null }));
    const supabase = createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })), updateUser },
      from: {
        profiles: () => createChain({ error: null }),
        mentors: () => createChain({ error: null }),
        mentor_tags: () => createChain({ error: null }),
      },
    });
    createClient.mockResolvedValue(supabase);

    await expect(submitMentor(null, formData(mentorFields))).rejects.toThrow(
      "REDIRECT:/setAccount/mentor/icon",
    );

    expect(updateUser).toHaveBeenCalledWith({ password: "secret1", data: { role: "mentor" } });
  });

  it("returns a friendly error and stops before any insert when updateUser fails", async () => {
    const profilesChain = createChain({ error: null });
    const mentorsChain = createChain({ error: null });
    const supabase = createSupabaseMock({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })),
        updateUser: vi.fn(async () => ({ error: { message: "updateUser failed" } })),
      },
      from: { profiles: () => profilesChain, mentors: () => mentorsChain },
    });
    createClient.mockResolvedValue(supabase);

    const result = await submitMentor(null, formData(mentorFields));

    expect(result).toEqual({
      error: "パスワードの設定に失敗しました。別のパスワードでお試しください。",
    });
    expect(mentorsChain.upsert).not.toHaveBeenCalled();
    expect(profilesChain.update).not.toHaveBeenCalled();
  });

  it("returns a friendly error and skips mentor_tags + profiles when the mentors upsert fails", async () => {
    const mentorTagsChain = createChain({ error: null });
    const profilesChain = createChain({ error: null });
    const supabase = createSupabaseMock({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })),
        updateUser: vi.fn(async () => ({ error: null })),
      },
      from: {
        profiles: () => profilesChain,
        mentors: () => createChain({ error: { message: "mentors upsert failed" } }),
        mentor_tags: () => mentorTagsChain,
      },
    });
    createClient.mockResolvedValue(supabase);

    const result = await submitMentor(null, formData(mentorFields));

    expect(result).toEqual({ error: "登録に失敗しました。もう一度お試しください。" });
    expect(mentorTagsChain.upsert).not.toHaveBeenCalled();
    expect(profilesChain.update).not.toHaveBeenCalled();
  });
});
