import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/mentorSlides", () => ({ fetchLatestSlideBytes: vi.fn() }));
vi.mock("@/lib/meetingSlide/buildMeetingSlide", () => ({
  buildMeetingSlide: vi.fn(async () => new Uint8Array([37, 80, 68, 70])),
}));

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { fetchLatestSlideBytes } from "@/lib/mentorSlides";
import { buildMeetingSlide } from "@/lib/meetingSlide/buildMeetingSlide";
import { GET } from "./route";

const MEETING = {
  id: "meeting-1",
  mentor: "mentor-1",
  trouble_episode: "困ったこと",
  unresolved_issues: "解決しなかったこと",
};

function dataMock({ meeting = MEETING, advice = { items: ["助言"] } } = {}) {
  return {
    meetings: () => createChain({ data: meeting, error: null }),
    meeting_advices: () => createChain({ data: advice, error: null }),
  };
}

function mockSession({ user = { id: "mentor-1" }, role = "mentor", data = dataMock() } = {}) {
  createClient.mockResolvedValue(
    createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user } })) },
      from: {
        profiles: () => createChain({ data: role ? { role } : null, error: null }),
        ...data,
      },
    }),
  );
}

const call = () => GET({}, { params: Promise.resolve({ meetingId: "meeting-1" }) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  fetchLatestSlideBytes.mockResolvedValue(new Uint8Array([1, 2, 3]));
});

describe("GET /api/meeting-slide/[meetingId]", () => {
  it("returns 401 when not logged in", async () => {
    mockSession({ user: null });
    expect((await call()).status).toBe(401);
  });

  it("returns 403 for the user side of the meeting (only mentors can share)", async () => {
    mockSession({ user: { id: "user-1" }, role: "user" });
    expect((await call()).status).toBe(403);
    expect(buildMeetingSlide).not.toHaveBeenCalled();
  });

  it("returns 403 for a mentor who is not this meeting's mentor", async () => {
    mockSession({ user: { id: "mentor-2" } });
    expect((await call()).status).toBe(403);
    expect(buildMeetingSlide).not.toHaveBeenCalled();
  });

  it("returns 404 when the meeting is not visible", async () => {
    mockSession({ data: dataMock({ meeting: null }) });
    expect((await call()).status).toBe(404);
  });

  it("builds the slide from the mentor's latest PDF, the survey answers and the advice", async () => {
    mockSession();

    const res = await call();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(fetchLatestSlideBytes).toHaveBeenCalledWith("mentor-1");
    expect(buildMeetingSlide).toHaveBeenCalledWith({
      mentorPdfBytes: new Uint8Array([1, 2, 3]),
      troubleEpisode: "困ったこと",
      unresolvedIssues: "解決しなかったこと",
      adviceItems: ["助言"],
    });
    expect(createSupabaseClient).not.toHaveBeenCalled();
  });

  it("lets an admin fetch it via the service-role client", async () => {
    mockSession({ user: { id: "admin-1" }, role: "admin", data: {} });
    createSupabaseClient.mockReturnValue(createSupabaseMock({ from: dataMock() }));

    expect((await call()).status).toBe(200);
    expect(createSupabaseClient).toHaveBeenCalled();
  });

  it("still builds the question page when R2 cannot be reached", async () => {
    mockSession({ data: dataMock({ advice: null }) });
    fetchLatestSlideBytes.mockRejectedValue(new Error("network"));

    expect((await call()).status).toBe(200);
    expect(buildMeetingSlide).toHaveBeenCalledWith(
      expect.objectContaining({ mentorPdfBytes: null, adviceItems: [] }),
    );
  });

  it("returns 500 when the PDF cannot be built", async () => {
    mockSession();
    buildMeetingSlide.mockRejectedValueOnce(new Error("boom"));

    expect((await call()).status).toBe(500);
  });
});
