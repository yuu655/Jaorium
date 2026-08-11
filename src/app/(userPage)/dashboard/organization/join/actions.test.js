import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { submitJoinRequest } from "./actions";

function formData(fields) {
  const map = new Map(Object.entries(fields));
  return { get: (key) => map.get(key) ?? null };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("submitJoinRequest", () => {
  it("requires a code before touching Supabase", async () => {
    createClient.mockResolvedValue({ auth: {} });

    const result = await submitJoinRequest(null, formData({ code: "  " }));

    expect(result).toEqual({ error: "組織コードを入力してください。" });
  });

  it("requires authentication", async () => {
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
    });

    const result = await submitJoinRequest(null, formData({ code: "AB12CD34" }));

    expect(result).toEqual({ error: "ログインが必要です。" });
  });

  it("rejects when the caller already belongs to another organization", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
        from: {
          organization_members: () =>
            createChain({ data: { organization_id: "org-existing" }, error: null }),
        },
      }),
    );

    const result = await submitJoinRequest(null, formData({ code: "AB12CD34" }));

    expect(result).toEqual({ error: "既に別の組織に所属しています。" });
  });

  it("rejects an unknown join code", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
        from: { organization_members: () => createChain({ data: null, error: null }) },
        rpc: vi.fn(async () => ({ data: [], error: null })),
      }),
    );

    const result = await submitJoinRequest(null, formData({ code: "NOTREAL1" }));

    expect(result).toEqual({ error: "組織コードが正しくありません。" });
  });

  it("inserts a pending join request for a valid code", async () => {
    const requestsChain = createChain({ error: null });
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
        from: {
          organization_members: () => createChain({ data: null, error: null }),
          organization_join_requests: () => requestsChain,
        },
        rpc: vi.fn(async () => ({ data: [{ id: "org-1", name: "テスト組織" }], error: null })),
      }),
    );

    const result = await submitJoinRequest(null, formData({ code: "ab12cd34" }));

    expect(result).toEqual({ success: true, organizationName: "テスト組織" });
    expect(requestsChain.insert).toHaveBeenCalledWith({
      organization_id: "org-1",
      user_id: "user-1",
      status: "pending",
    });
  });

  it("returns a friendly error when a pending request already exists", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
        from: {
          organization_members: () => createChain({ data: null, error: null }),
          organization_join_requests: () => createChain({ error: { code: "23505" } }),
        },
        rpc: vi.fn(async () => ({ data: [{ id: "org-1", name: "テスト組織" }], error: null })),
      }),
    );

    const result = await submitJoinRequest(null, formData({ code: "AB12CD34" }));

    expect(result).toEqual({ error: "既にこの組織へ参加申請中です。" });
  });
});
