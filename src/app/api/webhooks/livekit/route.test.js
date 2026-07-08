import { describe, it, expect, vi, beforeEach } from "vitest";

const { egressStartMock, receiveMock } = vi.hoisted(() => ({
  egressStartMock: vi.fn(async () => {}),
  receiveMock: vi.fn(),
}));

vi.mock("livekit-server-sdk", () => ({
  WebhookReceiver: vi.fn(function WebhookReceiver() {
    this.receive = receiveMock;
  }),
  EgressClient: vi.fn(function EgressClient() {
    this.startRoomCompositeEgress = egressStartMock;
  }),
  EncodedFileType: { MP4: "mp4" },
}));

import { POST } from "./route";

function makeRequest(body = "{}") {
  return { text: vi.fn(async () => body), headers: { get: vi.fn(() => "auth-header") } };
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  egressStartMock.mockClear();
});

describe("POST /api/webhooks/livekit", () => {
  it("starts a room recording when room_started fires", async () => {
    receiveMock.mockReturnValue({ event: "room_started", room: { name: "room-1" } });

    const res = await POST(makeRequest());

    expect(egressStartMock).toHaveBeenCalledWith(
      "room-1",
      expect.objectContaining({
        file: expect.objectContaining({ filepath: "recordings/room-1/{time}.mp4" }),
      }),
    );
    expect(await res.json()).toEqual({ ok: true });
  });

  it("does not start a recording for egress_ended", async () => {
    receiveMock.mockReturnValue({ event: "egress_ended", egressInfo: {} });

    await POST(makeRequest());

    expect(egressStartMock).not.toHaveBeenCalled();
  });

  it("does nothing for an unrecognized event", async () => {
    receiveMock.mockReturnValue({ event: "something_else" });

    const res = await POST(makeRequest());

    expect(egressStartMock).not.toHaveBeenCalled();
    expect(await res.json()).toEqual({ ok: true });
  });
});
