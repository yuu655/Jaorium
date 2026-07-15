import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

const { toJwtMock, addGrantMock } = vi.hoisted(() => ({
  toJwtMock: vi.fn(async () => "signed.jwt.token"),
  addGrantMock: vi.fn(),
}));

vi.mock("livekit-server-sdk", () => ({
  AccessToken: vi.fn(function AccessToken() {
    this.addGrant = addGrantMock;
    this.toJwt = toJwtMock;
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";
import { GET } from "./route";

function makeRequest(params) {
  return { url: `https://example.com/api/livekit-token?${new URLSearchParams(params)}` };
}

const meeting = { id: "meeting-1", user: "user-1", mentor: "mentor-1" };

function mockSession({
  user = null,
  role = null,
  meetingRow = meeting,
  confirmation = null,
  userName = null,
  mentorName = null,
} = {}) {
  createClient.mockResolvedValue(
    createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user } })) },
      from: {
        profiles: () => createChain({ data: role ? { role } : null, error: null }),
        meetings: () => createChain({ data: meetingRow, error: null }),
        meeting_confirmations: () => createChain({ data: confirmation, error: null }),
        users: () => createChain({ data: userName ? { name: userName } : null, error: null }),
        mentors: () => createChain({ data: mentorName ? { name: mentorName } : null, error: null }),
      },
    }),
  );
}

beforeEach(() => {
  vi.stubEnv("LIVEKIT_API_KEY", "lk-key");
  vi.stubEnv("LIVEKIT_API_SECRET", "lk-secret");
});

describe("GET /api/livekit-token", () => {
  it("requires roomName", async () => {
    mockSession();

    const res = await GET(makeRequest({}));

    expect(res.status).toBe(400);
    expect(AccessToken).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    mockSession({ user: null });

    const res = await GET(makeRequest({ roomName: "meeting-1" }));

    expect(res.status).toBe(401);
    expect(AccessToken).not.toHaveBeenCalled();
  });

  it("rejects a logged-in user who is not a participant of the meeting", async () => {
    mockSession({ user: { id: "someone-else" }, role: "user", confirmation: { id: "c1" } });

    const res = await GET(makeRequest({ roomName: "meeting-1" }));

    expect(res.status).toBe(403);
    expect(AccessToken).not.toHaveBeenCalled();
  });

  it("rejects when the meeting does not exist (or RLS hides it)", async () => {
    mockSession({ user: { id: "user-1" }, role: "user", meetingRow: null });

    const res = await GET(makeRequest({ roomName: "unknown-meeting" }));

    expect(res.status).toBe(403);
  });

  it("rejects a participant whose meeting has no credit consumption (payment gate)", async () => {
    mockSession({ user: { id: "user-1" }, role: "user", confirmation: null });

    const res = await GET(makeRequest({ roomName: "meeting-1" }));

    expect(res.status).toBe(402);
    expect(AccessToken).not.toHaveBeenCalled();
  });

  it("mints a token for a paid participant, using the authenticated user id as identity", async () => {
    mockSession({
      user: { id: "mentor-1" },
      role: "mentor",
      confirmation: { id: "c1" },
      mentorName: "山田先輩",
    });

    const res = await GET(
      // userNameを渡しても無視され、identityは認証済みIDになる（なりすまし防止）
      makeRequest({ roomName: "meeting-1", userName: "spoofed-identity" }),
    );

    expect(res.status).toBe(200);
    expect(AccessToken).toHaveBeenCalledWith("lk-key", "lk-secret", {
      identity: "mentor-1",
      name: "山田先輩",
    });
    expect(addGrantMock).toHaveBeenCalledWith({
      roomJoin: true,
      room: "meeting-1",
      canPublish: true,
      canSubscribe: true,
    });
    expect(await res.json()).toEqual({ token: "signed.jwt.token" });
  });

  it("sets the display name from the users table for a user participant", async () => {
    mockSession({
      user: { id: "user-1" },
      role: "user",
      confirmation: { id: "c1" },
      userName: "田中太郎",
    });

    const res = await GET(makeRequest({ roomName: "meeting-1" }));

    expect(res.status).toBe(200);
    expect(AccessToken).toHaveBeenCalledWith("lk-key", "lk-secret", {
      identity: "user-1",
      name: "田中太郎",
    });
  });

  it("falls back to a generic display name when no name row exists", async () => {
    // users/mentors/profilesいずれからも名前が取れない場合は「参加者」
    mockSession({ user: { id: "user-1" }, role: "user", confirmation: { id: "c1" } });

    const res = await GET(makeRequest({ roomName: "meeting-1" }));

    expect(res.status).toBe(200);
    expect(AccessToken).toHaveBeenCalledWith("lk-key", "lk-secret", {
      identity: "user-1",
      name: "参加者",
    });
  });

  it("mints a token for an admin without participant/payment checks", async () => {
    mockSession({ user: { id: "admin-1" }, role: "admin", meetingRow: null, confirmation: null });

    const res = await GET(makeRequest({ roomName: "meeting-1" }));

    expect(res.status).toBe(200);
    expect(AccessToken).toHaveBeenCalledWith("lk-key", "lk-secret", {
      identity: "admin-1",
      name: "運営",
    });
  });
});
