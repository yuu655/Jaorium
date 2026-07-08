import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
vi.mock("next/headers", () => ({
  draftMode: vi.fn(async () => ({ disable: vi.fn() })),
}));

import { draftMode } from "next/headers";
import { GET } from "./route";

function makeRequest(params) {
  return { url: `https://www.jaorium.com/api/exit_draft?${new URLSearchParams(params)}` };
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("GET /api/exit_draft", () => {
  it("disables draft mode and redirects to the requested path", async () => {
    const disable = vi.fn();
    draftMode.mockResolvedValue({ disable });

    await expect(GET(makeRequest({ redirect: "/articles/hello" }))).rejects.toThrow(
      "REDIRECT:/articles/hello",
    );

    expect(disable).toHaveBeenCalled();
  });

  it("defaults to redirecting to / when no redirect param is given", async () => {
    draftMode.mockResolvedValue({ disable: vi.fn() });

    await expect(GET(makeRequest({}))).rejects.toThrow("REDIRECT:/");
  });
});
