import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/r2", () => ({ r2: {} }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@aws-sdk/client-s3", () => ({
  PutObjectCommand: vi.fn(function PutObjectCommand(input) {
    this.input = input;
  }),
}));
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(async () => "https://signed.example.com/upload"),
}));

import { createClient } from "@/lib/supabase/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { POST } from "./route";

function makeRequest(params, user) {
  return {
    nextUrl: { searchParams: new URLSearchParams(params) },
    __user: user,
  };
}

function mockSupabase(user) {
  createClient.mockResolvedValue({
    auth: { getUser: vi.fn(async () => ({ data: { user } })) },
  });
}

describe("POST /api/r2_upload", () => {
  it("rejects unauthenticated requests", async () => {
    mockSupabase(null);

    const res = await POST(makeRequest({ filename: "photo.png", kinds: "icon" }));

    expect(res.status).toBe(401);
  });

  it("builds a namespaced key from role/userId/kinds/filename and returns a signed URL", async () => {
    mockSupabase({ id: "user-1", user_metadata: { role: "mentor" } });

    const res = await POST(makeRequest({ filename: "photo.png", kinds: "icon" }));
    const body = await res.json();

    expect(body).toBe("https://signed.example.com/upload");
    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Key: "mentor/user-1/icon/photo.png",
        ContentType: "image/png",
      }),
    );
    expect(getSignedUrl).toHaveBeenCalled();
  });

  it("falls back to application/octet-stream for unknown extensions", async () => {
    mockSupabase({ id: "user-1", user_metadata: { role: "user" } });

    await POST(makeRequest({ filename: "notes.xyz", kinds: "docs" }));

    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({ ContentType: "application/octet-stream" }),
    );
  });

  it("rejects a filename containing path-traversal segments with 400, before touching S3", async () => {
    mockSupabase({ id: "user-1", user_metadata: { role: "user" } });

    const res = await POST(
      makeRequest({ filename: "../../mentor/other-user-id/icon.png", kinds: "icon" }),
    );

    expect(res.status).toBe(400);
    expect(PutObjectCommand).not.toHaveBeenCalled();
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it("rejects a kinds value containing path-traversal segments with 400", async () => {
    mockSupabase({ id: "user-1", user_metadata: { role: "user" } });

    const res = await POST(makeRequest({ filename: "icon.png", kinds: "../shared" }));

    expect(res.status).toBe(400);
    expect(PutObjectCommand).not.toHaveBeenCalled();
  });

  it("rejects filenames containing a forward or back slash", async () => {
    mockSupabase({ id: "user-1", user_metadata: { role: "user" } });

    const slash = await POST(makeRequest({ filename: "sub/icon.png", kinds: "icon" }));
    const backslash = await POST(makeRequest({ filename: "sub\\icon.png", kinds: "icon" }));

    expect(slash.status).toBe(400);
    expect(backslash.status).toBe(400);
  });

  it("rejects missing filename/kinds", async () => {
    mockSupabase({ id: "user-1", user_metadata: { role: "user" } });

    const res = await POST(makeRequest({ kinds: "icon" }));

    expect(res.status).toBe(400);
  });
});
