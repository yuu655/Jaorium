import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/r2", () => ({ r2: {} }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@aws-sdk/client-s3", () => ({
  PutObjectCommand: vi.fn(function PutObjectCommand(input) {
    this.input = input;
  }),
  GetObjectCommand: vi.fn(function GetObjectCommand(input) {
    this.input = input;
  }),
}));
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(async () => "https://signed.example.com/avatar-upload"),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { createClient } from "@/lib/supabase/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { revalidatePath, revalidateTag } from "next/cache";
import { updateUserProfile, updateMentorProfile, uploadAvatar } from "./actions";

function formData(fields) {
  const map = new Map(Object.entries(fields));
  const getAll = (key) => {
    const value = map.get(key);
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
  };
  return { get: (key) => map.get(key) ?? null, getAll };
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("updateUserProfile server action", () => {
  it("updates the user's profile fields and redirects on success", async () => {
    const usersChain = createChain({ error: null });
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
        from: { users: () => usersChain },
      }),
    );

    await expect(
      updateUserProfile(null, formData({ name: "太郎", grade: "高3", desire: "東京大学" })),
    ).rejects.toThrow("REDIRECT:/dashboard/user");

    expect(usersChain.update).toHaveBeenCalledWith({
      name: "太郎",
      grade: "高3",
      desire: "東京大学",
    });
    expect(revalidateTag).toHaveBeenCalledWith("dashboard-user-user-1");
  });

  it("does not redirect when the update fails", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
        from: { users: () => createChain({ error: { message: "db error" } }) },
      }),
    );

    await updateUserProfile(null, formData({ name: "太郎", grade: "高3", desire: "東京大学" }));

    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("updateMentorProfile server action", () => {
  it("replaces mentor_tags (delete then insert) and redirects on success", async () => {
    const mentorsChain = createChain({ error: null });
    const mentorTagsChain = createChain({ error: null });
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })) },
        from: { mentors: () => mentorsChain, mentor_tags: () => mentorTagsChain },
      }),
    );

    await expect(
      updateMentorProfile(
        null,
        formData({
          name: "花子",
          university: "京都大学",
          faculty: "工学部",
          bio: "よろしく",
          region: "関西",
          quote: "頑張ろう",
          tagIds: ["tag-1", "tag-2"],
        }),
      ),
    ).rejects.toThrow("REDIRECT:/dashboard/mentor");

    expect(mentorTagsChain.delete).toHaveBeenCalled();
    expect(mentorTagsChain.insert).toHaveBeenCalledWith([
      { mentor_id: "mentor-1", tag_id: "tag-1" },
      { mentor_id: "mentor-1", tag_id: "tag-2" },
    ]);
    expect(revalidateTag).toHaveBeenCalledWith("dashboard-mentor-mentor-1");
    expect(revalidateTag).toHaveBeenCalledWith("mentor-tags-mentor-1");
  });

  // Current behavior, documented as-is (not confirmed to be intentional - flagged
  // separately for the user to check against the actual is_allowed checkbox markup):
  // formData.getAll("is_allowed") returns [] when nothing is submitted for that field,
  // so is_allowed[0] is undefined, not null - `undefined === null` is false, so
  // is_allowed ends up being saved as `true` even when nothing was submitted.
  it("[unconfirmed] saves is_allowed=true when the is_allowed field is entirely absent", async () => {
    const mentorsChain = createChain({ error: null });
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })) },
        from: { mentors: () => mentorsChain, mentor_tags: () => createChain({ error: null }) },
      }),
    );

    await expect(
      updateMentorProfile(null, formData({ name: "花子", tagIds: [] })),
    ).rejects.toThrow("REDIRECT:/dashboard/mentor");

    expect(mentorsChain.update).toHaveBeenCalledWith(expect.objectContaining({ is_allowed: true }));
  });

  it("does not redirect when either the mentors update or the tag replace fails", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })) },
        from: {
          mentors: () => createChain({ error: { message: "db error" } }),
          mentor_tags: () => createChain({ error: null }),
        },
      }),
    );

    await updateMentorProfile(null, formData({ name: "花子", tagIds: [] }));

    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("uploadAvatar server action", () => {
  it("requires a file", async () => {
    createClient.mockResolvedValue(createSupabaseMock());

    const result = await uploadAvatar(null);

    expect(result).toEqual({ success: false, message: "画像を選択してください" });
  });

  it("rejects unauthenticated requests", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({ auth: { getUser: vi.fn(async () => ({ data: { user: null } })) } }),
    );

    const result = await uploadAvatar({ name: "avatar.png", type: "image/png" });

    expect(result).toEqual({ success: false, message: "ログインしてください" });
  });

  // パストラバーサル防止の回帰テスト(api/r2_upload/route.jsと同じ対策)
  it.each([
    ["../../../etc/passwd"],
    ["a/b.png"],
    ["a\\b.png"],
    ["..png.."],
    [""],
  ])("rejects unsafe filename %j without signing an upload URL", async (filename) => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({
            data: { user: { id: "user-1", user_metadata: { role: "user" } } },
          })),
        },
      }),
    );
    global.fetch = vi.fn();

    const result = await uploadAvatar({ name: filename, type: "image/png" });

    expect(result).toEqual({ success: false, message: "不正なファイル名です" });
    expect(getSignedUrl).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // roleはuser_metadataではなくprofilesテーブルから読む(現行のOTPサインアップは
  // user_metadata.roleを設定しないため)。user_metadataなしのユーザーで検証する。
  it("uploads to R2 under the profiles.role/id namespace and saves the returned key", async () => {
    const usersChain = createChain({ data: [{ id: "user-1" }], error: null });
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
        },
        from: {
          profiles: () => createChain({ data: { role: "user" }, error: null }),
          users: () => usersChain,
        },
      }),
    );
    global.fetch = vi.fn(async () => ({ ok: true }));

    const result = await uploadAvatar({ name: "avatar.png", type: "image/png" });

    expect(result).toEqual({ success: true });
    expect(getSignedUrl).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      "https://signed.example.com/avatar-upload",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(usersChain.update).toHaveBeenCalledWith({ icon: "user/user-1/avatars/avatar.png" });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/user");
  });

  it("saves to the mentors table and redirect path for a mentor", async () => {
    const mentorsChain = createChain({ data: [{ id: "mentor-1" }], error: null });
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })),
        },
        from: {
          profiles: () => createChain({ data: { role: "mentor" }, error: null }),
          mentors: () => mentorsChain,
        },
      }),
    );
    global.fetch = vi.fn(async () => ({ ok: true }));

    await uploadAvatar({ name: "avatar.png", type: "image/png" });

    expect(mentorsChain.update).toHaveBeenCalledWith({ icon: "mentor/mentor-1/avatars/avatar.png" });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/mentor");
  });

  // 回帰テスト: user_metadata.roleがnullでも、profiles.roleが取れないと
  // 成功を装って何もしない(0行UPDATE)状態になっていたバグの再発防止
  it("fails fast when profiles.role is missing, before touching R2", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
        },
        from: { profiles: () => createChain({ data: null, error: null }) },
      }),
    );
    global.fetch = vi.fn();

    const result = await uploadAvatar({ name: "avatar.png", type: "image/png" });

    expect(result).toEqual({ success: false, message: "アカウント情報を取得できませんでした" });
    expect(getSignedUrl).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // 回帰テスト: UPDATEが0行にマッチしてもSupabaseはエラーを返さないため、
  // .select()で返った行数を確認して失敗として扱う
  it("reports failure when the icon update matches no rows", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
        },
        from: {
          profiles: () => createChain({ data: { role: "user" }, error: null }),
          users: () => createChain({ data: [], error: null }),
        },
      }),
    );
    global.fetch = vi.fn(async () => ({ ok: true }));

    const result = await uploadAvatar({ name: "avatar.png", type: "image/png" });

    expect(result).toEqual({ success: false, message: "プロフィールが見つかりませんでした" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns an error message when the R2 upload itself fails", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
        },
        from: { profiles: () => createChain({ data: { role: "user" }, error: null }) },
      }),
    );
    global.fetch = vi.fn(async () => ({ ok: false }));

    const result = await uploadAvatar({ name: "avatar.png", type: "image/png" });

    expect(result).toEqual({ success: false, message: "R2へのアップロードに失敗しました" });
  });
});
