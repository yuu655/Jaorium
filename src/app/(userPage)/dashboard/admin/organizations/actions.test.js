import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  createOrganization,
  assignOwner,
  removeOwner,
  deleteOrganization,
  grantOrganizationCredits,
} from "./actions";

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
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("admin organization actions — authorization", () => {
  it("rejects unauthenticated callers", async () => {
    createClient.mockResolvedValue({ auth: { getUser: vi.fn(async () => ({ data: { user: null } })) } });

    const result = await createOrganization("テスト組織");

    expect(result).toEqual({ error: "ログインが必要です。" });
  });

  it("rejects non-admin callers", async () => {
    mockAdminSession({ isAdmin: false });

    const result = await grantOrganizationCredits("org-1", 10, "");

    expect(result).toEqual({ error: "権限がありません。" });
  });
});

describe("createOrganization", () => {
  it("requires a name before touching Supabase", async () => {
    mockAdminSession();

    const result = await createOrganization("  ");

    expect(result).toEqual({ error: "組織名を入力してください。" });
  });

  it("retries the join code on a collision and succeeds", async () => {
    mockAdminSession();
    const insert = vi
      .fn()
      .mockResolvedValueOnce({ error: { code: "23505" } })
      .mockResolvedValueOnce({ error: null });
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({ from: { organizations: () => ({ insert }) } }),
    );

    const result = await createOrganization("テスト組織");

    expect(result).toEqual({ success: true });
    expect(insert).toHaveBeenCalledTimes(2);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: "テスト組織", created_by: ADMIN_ID }),
    );
  });
});

describe("assignOwner", () => {
  it("requires an email before touching Supabase", async () => {
    mockAdminSession();

    const result = await assignOwner("org-1", "");

    expect(result).toEqual({ error: "メールアドレスを入力してください。" });
  });

  it("assigns an existing user found by email without inviting, and marks their profile set=true", async () => {
    mockAdminSession();
    const ownersChain = createChain({ error: null });
    const profilesChain = createChain({ error: null });
    const inviteUserByEmail = vi.fn();
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({
        rpc: vi.fn(async () => ({ data: "existing-user-1", error: null })),
        from: { organization_owners: () => ownersChain, profiles: () => profilesChain },
        auth: { admin: { inviteUserByEmail } },
      }),
    );

    const result = await assignOwner("org-1", "existing@example.com");

    expect(result).toEqual({ success: true });
    expect(inviteUserByEmail).not.toHaveBeenCalled();
    expect(ownersChain.insert).toHaveBeenCalledWith({
      organization_id: "org-1",
      user_id: "existing-user-1",
    });
    expect(profilesChain.update).toHaveBeenCalledWith({ role: "organization", set: true });
  });

  it("invites a new user by email when no existing account is found, and leaves their profile set=false", async () => {
    mockAdminSession();
    const ownersChain = createChain({ error: null });
    const profilesChain = createChain({ error: null });
    const inviteUserByEmail = vi.fn(async () => ({ data: { user: { id: "new-user-1" } }, error: null }));
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({
        rpc: vi.fn(async () => ({ data: null, error: null })),
        from: { organization_owners: () => ownersChain, profiles: () => profilesChain },
        auth: { admin: { inviteUserByEmail } },
      }),
    );

    const result = await assignOwner("org-1", "new@example.com");

    expect(result).toEqual({ success: true });
    expect(inviteUserByEmail).toHaveBeenCalledWith(
      "new@example.com",
      expect.objectContaining({
        redirectTo: expect.stringContaining("/api/auth/confirm?next=/dashboard/organization/setPassword"),
      }),
    );
    expect(ownersChain.insert).toHaveBeenCalledWith({
      organization_id: "org-1",
      user_id: "new-user-1",
    });
    expect(profilesChain.update).toHaveBeenCalledWith({ role: "organization", set: false });
  });

  it("re-syncs the profile even when the user is already an owner (idempotent retry)", async () => {
    mockAdminSession();
    const profilesChain = createChain({ error: null });
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({
        rpc: vi.fn(async () => ({ data: "existing-user-1", error: null })),
        from: {
          organization_owners: () => createChain({ error: { code: "23505" } }),
          profiles: () => profilesChain,
        },
      }),
    );

    const result = await assignOwner("org-1", "existing@example.com");

    expect(result).toEqual({ error: "このユーザーは既にownerとして登録されています。" });
    expect(profilesChain.update).toHaveBeenCalledWith({ role: "organization", set: true });
  });
});

describe("removeOwner", () => {
  // organization_owners への delete と select(残存確認) の2回の呼び出しを
  // 呼び出し順で区別するため、createChainではなく手組みのモックを使う
  function mockOwnersFromWithRemaining(remaining) {
    const deleteEq2 = vi.fn(async () => ({ error: null }));
    const deleteEq1 = vi.fn(() => ({ eq: deleteEq2 }));
    const selectLimit = vi.fn(async () => ({ data: remaining, error: null }));
    const selectEq = vi.fn(() => ({ limit: selectLimit }));
    return {
      delete: vi.fn(() => ({ eq: deleteEq1 })),
      select: vi.fn(() => ({ eq: selectEq })),
    };
  }

  it("rejects non-admin callers", async () => {
    mockAdminSession({ isAdmin: false });

    const result = await removeOwner("org-1", "user-1");

    expect(result).toEqual({ error: "権限がありません。" });
  });

  it("resets the profile to pending/unset when no other ownerships remain", async () => {
    mockAdminSession();
    const profilesChain = createChain({ error: null });
    const ownersFrom = mockOwnersFromWithRemaining([]);
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({
        from: { organization_owners: () => ownersFrom, profiles: () => profilesChain },
      }),
    );

    const result = await removeOwner("org-1", "user-1");

    expect(result).toEqual({ success: true });
    expect(profilesChain.update).toHaveBeenCalledWith({ role: "pending", set: false });
  });

  it("leaves the profile untouched when the user still owns another organization", async () => {
    mockAdminSession();
    const profilesChain = createChain({ error: null });
    const ownersFrom = mockOwnersFromWithRemaining([{ organization_id: "org-2" }]);
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({
        from: { organization_owners: () => ownersFrom, profiles: () => profilesChain },
      }),
    );

    const result = await removeOwner("org-1", "user-1");

    expect(result).toEqual({ success: true });
    expect(profilesChain.update).not.toHaveBeenCalled();
  });
});

describe("deleteOrganization", () => {
  it("rejects non-admin callers", async () => {
    mockAdminSession({ isAdmin: false });

    const result = await deleteOrganization("org-1");

    expect(result).toEqual({ error: "権限がありません。" });
  });

  it("sets status to archived instead of hard-deleting the row", async () => {
    mockAdminSession();
    const orgsChain = createChain({ error: null });
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({ from: { organizations: () => orgsChain } }),
    );

    const result = await deleteOrganization("org-1");

    expect(result).toEqual({ success: true });
    expect(orgsChain.update).toHaveBeenCalledWith({ status: "archived" });
    expect(orgsChain.delete).not.toHaveBeenCalled();
  });
});

describe("grantOrganizationCredits", () => {
  it("rejects a non-positive amount before touching Supabase", async () => {
    mockAdminSession();

    const result = await grantOrganizationCredits("org-1", 0, "");

    expect(result).toEqual({ error: "付与数は1以上の整数で入力してください。" });
  });

  it("inserts a manual_grant credit log", async () => {
    mockAdminSession();
    const logsChain = createChain({ error: null });
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({ from: { organization_credit_logs: () => logsChain } }),
    );

    const result = await grantOrganizationCredits("org-1", "50", "年間契約分");

    expect(result).toEqual({ success: true });
    expect(logsChain.insert).toHaveBeenCalledWith({
      organization_id: "org-1",
      change: 50,
      reason: "manual_grant",
      granted_by: ADMIN_ID,
    });
  });
});
