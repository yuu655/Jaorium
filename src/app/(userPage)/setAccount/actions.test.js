import { describe, it, expect, vi } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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

describe("submitUser server action", () => {
  it("throws when password and password_check don't match, before touching Supabase", async () => {
    createClient.mockResolvedValue({ auth: {}, from: vi.fn() });

    await expect(
      submitUser(null, formData({ ...userFields, password_check: "different" })),
    ).rejects.toThrow("パスワードが一致しません");
  });

  it("throws the underlying error when the profiles update fails", async () => {
    const supabase = createSupabaseMock({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
        updateUser: vi.fn(async () => ({ error: null })),
      },
      from: { profiles: () => createChain({ error: { message: "profiles update failed" } }) },
    });
    createClient.mockResolvedValue(supabase);

    await expect(submitUser(null, formData(userFields))).rejects.toMatchObject({
      message: "profiles update failed",
    });
  });

  it("marks the profile as set, sets role=user, inserts the user row, and redirects to the icon step", async () => {
    const updateUser = vi.fn(async () => ({ error: null }));
    const usersChain = createChain({ error: null });
    const supabase = createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })), updateUser },
      from: {
        profiles: () => createChain({ error: null }),
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
    expect(usersChain.insert).toHaveBeenCalledWith([
      expect.objectContaining({ id: "user-1", name: "受験生太郎", grade: "高3", desire: "東京大学" }),
    ]);
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
  it("throws when password and password_check don't match", async () => {
    createClient.mockResolvedValue({ auth: {}, from: vi.fn() });

    await expect(
      submitMentor(null, formData({ ...mentorFields, password_check: "different" })),
    ).rejects.toThrow("パスワードが一致しません");
  });

  it("inserts mentor + mentor_tags and redirects to the icon step on success", async () => {
    const mentorsChain = createChain({ error: null });
    const mentorTagsChain = createChain({ error: null });
    const supabase = createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })) },
      from: {
        profiles: () => createChain({ error: null }),
        mentors: () => mentorsChain,
        mentor_tags: () => mentorTagsChain,
      },
    });
    createClient.mockResolvedValue(supabase);

    await expect(submitMentor(null, formData(mentorFields))).rejects.toThrow(
      "REDIRECT:/setAccount/mentor/icon",
    );

    expect(mentorsChain.insert).toHaveBeenCalledWith([
      expect.objectContaining({ id: "mentor-1", name: "先輩花子", university: "京都大学" }),
    ]);
    expect(mentorTagsChain.insert).toHaveBeenCalledWith([
      { mentor_id: "mentor-1", tag_id: "tag-1" },
      { mentor_id: "mentor-1", tag_id: "tag-2" },
    ]);
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

  it("throws and stops before marking the profile set when updateUser fails", async () => {
    const profilesChain = createChain({ error: null });
    const supabase = createSupabaseMock({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })),
        updateUser: vi.fn(async () => ({ error: { message: "updateUser failed" } })),
      },
      from: { profiles: () => profilesChain },
    });
    createClient.mockResolvedValue(supabase);

    await expect(submitMentor(null, formData(mentorFields))).rejects.toMatchObject({
      message: "updateUser failed",
    });

    expect(profilesChain.update).not.toHaveBeenCalled();
  });

  it("throws the mentors-insert error", async () => {
    const supabase = createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })) },
      from: {
        profiles: () => createChain({ error: null }),
        mentors: () => createChain({ error: { message: "mentors insert failed" } }),
        mentor_tags: () => createChain({ error: null }),
      },
    });
    createClient.mockResolvedValue(supabase);

    await expect(submitMentor(null, formData(mentorFields))).rejects.toMatchObject({
      message: "mentors insert failed",
    });
  });

  // Current behavior (not one of the three approved fixes): the code inserts into
  // mentor_tags unconditionally, even when the preceding mentors insert already failed -
  // there's no early return between the two calls. This test just documents that.
  it("still attempts the mentor_tags insert even when the mentors insert already failed", async () => {
    const mentorTagsChain = createChain({ error: null });
    const supabase = createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })) },
      from: {
        profiles: () => createChain({ error: null }),
        mentors: () => createChain({ error: { message: "mentors insert failed" } }),
        mentor_tags: () => mentorTagsChain,
      },
    });
    createClient.mockResolvedValue(supabase);

    await expect(submitMentor(null, formData(mentorFields))).rejects.toBeTruthy();

    expect(mentorTagsChain.insert).toHaveBeenCalled();
  });
});
