import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn(async () => ({})) }));
vi.mock("resend", () => ({
  Resend: vi.fn(function Resend() {
    this.emails = { send: sendMock };
  }),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  approveJoinRequest,
  rejectJoinRequest,
  removeMember,
  setMemberCreditLimit,
  regenerateJoinCode,
  requestCreditTopUp,
} from "./actions";

const ORG_ID = "org-1";
const OWNER_ID = "owner-1";

function mockOwnerSession({ isOwner = true } = {}) {
  createClient.mockResolvedValue(
    createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: OWNER_ID, email: "owner@example.com" } } })) },
      from: {
        organization_owners: () =>
          createChain({ data: isOwner ? { organization_id: ORG_ID } : null, error: null }),
      },
    }),
  );
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("organization owner actions — authorization", () => {
  it("rejects unauthenticated callers", async () => {
    createClient.mockResolvedValue({ auth: { getUser: vi.fn(async () => ({ data: { user: null } })) } });

    const result = await approveJoinRequest("req-1", ORG_ID);

    expect(result).toEqual({ error: "ログインが必要です。" });
  });

  it("rejects callers who are not an owner of the target organization", async () => {
    mockOwnerSession({ isOwner: false });

    const result = await removeMember("member-1", ORG_ID);

    expect(result).toEqual({ error: "権限がありません。" });
  });
});

describe("approveJoinRequest", () => {
  it("calls the approve_join_request RPC with the caller as decided_by", async () => {
    mockOwnerSession();
    const rpc = vi.fn(async () => ({ error: null }));
    createSupabaseClient.mockReturnValue(createSupabaseMock({ rpc }));

    const result = await approveJoinRequest("req-1", ORG_ID);

    expect(result).toEqual({ success: true });
    expect(rpc).toHaveBeenCalledWith("approve_join_request", {
      p_request_id: "req-1",
      p_decided_by: OWNER_ID,
    });
  });

  it("surfaces a friendly error when the user is already an active member elsewhere", async () => {
    mockOwnerSession();
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({ rpc: vi.fn(async () => ({ error: { message: "ALREADY_MEMBER" } })) }),
    );

    const result = await approveJoinRequest("req-1", ORG_ID);

    expect(result).toEqual({ error: "このユーザーは既に別の組織のメンバーです。" });
  });
});

describe("rejectJoinRequest", () => {
  it("updates the request to rejected", async () => {
    mockOwnerSession();
    const requestsChain = createChain({ error: null });
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({ from: { organization_join_requests: () => requestsChain } }),
    );

    const result = await rejectJoinRequest("req-1", ORG_ID);

    expect(result).toEqual({ success: true });
    expect(requestsChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "rejected", decided_by: OWNER_ID }),
    );
  });
});

describe("removeMember", () => {
  it("marks the member as removed", async () => {
    mockOwnerSession();
    const membersChain = createChain({ error: null });
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({ from: { organization_members: () => membersChain } }),
    );

    const result = await removeMember("member-1", ORG_ID);

    expect(result).toEqual({ success: true });
    expect(membersChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "removed" }),
    );
  });
});

describe("setMemberCreditLimit", () => {
  it("rejects a negative limit before touching Supabase", async () => {
    mockOwnerSession();

    const result = await setMemberCreditLimit("member-1", ORG_ID, -1);

    expect(result).toEqual({ error: "上限は0以上の整数で入力してください。" });
  });

  it("updates credit_limit to null when the limit is cleared (unlimited)", async () => {
    mockOwnerSession();
    const membersChain = createChain({ error: null });
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({ from: { organization_members: () => membersChain } }),
    );

    const result = await setMemberCreditLimit("member-1", ORG_ID, "");

    expect(result).toEqual({ success: true });
    expect(membersChain.update).toHaveBeenCalledWith({ credit_limit: null });
  });

  it("updates credit_limit to the given integer", async () => {
    mockOwnerSession();
    const membersChain = createChain({ error: null });
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({ from: { organization_members: () => membersChain } }),
    );

    const result = await setMemberCreditLimit("member-1", ORG_ID, "5");

    expect(result).toEqual({ success: true });
    expect(membersChain.update).toHaveBeenCalledWith({ credit_limit: 5 });
  });
});

describe("regenerateJoinCode", () => {
  it("retries on a join_code collision and succeeds on the next attempt", async () => {
    mockOwnerSession();
    const update = vi
      .fn()
      .mockReturnValueOnce({ eq: vi.fn(async () => ({ error: { code: "23505" } })) })
      .mockReturnValueOnce({ eq: vi.fn(async () => ({ error: null })) });
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({ from: { organizations: () => ({ update }) } }),
    );

    const result = await regenerateJoinCode(ORG_ID);

    expect(result.success).toBe(true);
    expect(result.joinCode).toBeTruthy();
    expect(update).toHaveBeenCalledTimes(2);
  });
});

describe("requestCreditTopUp", () => {
  it("sends a notification email to staff", async () => {
    mockOwnerSession();
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({
        from: { organizations: () => createChain({ data: { name: "テスト組織" }, error: null }) },
      }),
    );

    const result = await requestCreditTopUp(ORG_ID, "20回分お願いします");

    expect(result).toEqual({ success: true });
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining("テスト組織") }),
    );
  });
});
