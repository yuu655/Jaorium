import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/r2", () => ({ r2: { send: vi.fn() } }));
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(async () => "https://signed.example/put"),
}));

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createMentorSlideUploadUrl, setMentorAdminAllow } from "./actions";

const ADMIN_ID = "admin-1";

function mockAdminSession({ isAdmin = true } = {}) {
  createClient.mockResolvedValue(
    createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: ADMIN_ID } } })) },
      from: {
        profiles: () =>
          createChain({ data: { role: isAdmin ? "admin" : "user" }, error: null }),
      },
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("setMentorAdminAllow", () => {
  it("rejects unauthenticated callers", async () => {
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
    });

    const result = await setMentorAdminAllow("mentor-1", true);

    expect(result).toEqual({ error: "ログインが必要です。" });
    expect(createSupabaseClient).not.toHaveBeenCalled();
  });

  it("rejects non-admin callers before touching the service-role client", async () => {
    mockAdminSession({ isAdmin: false });

    const result = await setMentorAdminAllow("mentor-1", true);

    expect(result).toEqual({ error: "権限がありません。" });
    expect(createSupabaseClient).not.toHaveBeenCalled();
  });

  it("rejects a non-boolean allow value", async () => {
    mockAdminSession();

    const result = await setMentorAdminAllow("mentor-1", "true");

    expect(result).toEqual({ error: "承認状態の指定が不正です。" });
    expect(createSupabaseClient).not.toHaveBeenCalled();
  });

  it("updates mentor_secret.admin_allow via the service-role client", async () => {
    mockAdminSession();
    const secretChain = createChain({ error: null });
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({ from: { mentor_secret: () => secretChain } }),
    );

    const result = await setMentorAdminAllow("mentor-1", true);

    expect(result).toEqual({ success: true });
    expect(secretChain.update).toHaveBeenCalledWith({ admin_allow: true });
    expect(secretChain.eq).toHaveBeenCalledWith("id", "mentor-1");
  });

  it("invalidates the public mentor-list cache so the change is visible immediately", async () => {
    mockAdminSession();
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({ from: { mentor_secret: () => createChain({ error: null }) } }),
    );

    await setMentorAdminAllow("mentor-1", false);

    expect(revalidateTag).toHaveBeenCalledWith("mentors");
  });

  it("surfaces a generic error when the update fails", async () => {
    mockAdminSession();
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({
        from: { mentor_secret: () => createChain({ error: { message: "boom" } }) },
      }),
    );

    const result = await setMentorAdminAllow("mentor-1", true);

    expect(result).toEqual({ error: "承認状態の更新に失敗しました。" });
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("createMentorSlideUploadUrl", () => {
  function mockMentorLookup(result) {
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({ from: { mentors: () => createChain(result) } }),
    );
  }

  it("rejects non-admin callers before signing anything", async () => {
    mockAdminSession({ isAdmin: false });

    const result = await createMentorSlideUploadUrl("mentor-1", "a.pdf", 100);

    expect(result).toEqual({ error: "権限がありません。" });
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it.each([
    ["mentor-1", "a.pptx", 100],
    ["mentor-1", "../a.pdf", 100],
    ["../x", "a.pdf", 100],
    ["mentor-1", "a.pdf", 0],
    ["mentor-1", "a.pdf", 50 * 1024 * 1024 + 1],
  ])("rejects invalid input (%s, %s, %s)", async (mentorId, filename, size) => {
    mockAdminSession();

    const result = await createMentorSlideUploadUrl(mentorId, filename, size);

    expect(result.error).toBeDefined();
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it("rejects an unknown mentor id", async () => {
    mockAdminSession();
    mockMentorLookup({ data: null, error: null });

    const result = await createMentorSlideUploadUrl("mentor-x", "a.pdf", 100);

    expect(result).toEqual({ error: "メンターが見つかりません。" });
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it("returns a presigned PUT url under mentors/{id}/slide/", async () => {
    mockAdminSession();
    mockMentorLookup({ data: { id: "mentor-1" }, error: null });

    const result = await createMentorSlideUploadUrl("mentor-1", "a.pdf", 100);

    expect(result).toEqual({ url: "https://signed.example/put" });
    expect(getSignedUrl.mock.calls[0][1].input.Key).toBe("mentors/mentor-1/slide/a.pdf");
  });
});
