import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/r2", () => ({ r2: { send: vi.fn() } }));
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(async () => "https://signed.example/url"),
}));

import { r2 } from "@/lib/r2";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  createSlideUploadUrl,
  createSlideViewUrl,
  fetchLatestSlideBytes,
  isPdfFilename,
  isSafePathSegment,
  listMentorIdsWithSlides,
  listSlides,
  slideKey,
} from "./mentorSlides";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CLOUDFLARE_R2_BUCKET_NAME", "private-bucket");
});

describe("path validation", () => {
  it.each(["../x", "a/b", "a\b", "", "a\nb", null, 1])("rejects %j", (value) => {
    expect(isSafePathSegment(value)).toBe(false);
  });

  it("accepts plain and Japanese filenames", () => {
    expect(isSafePathSegment("資料 v2.pdf")).toBe(true);
  });

  it("only accepts .pdf filenames", () => {
    expect(isPdfFilename("slide.PDF")).toBe(true);
    expect(isPdfFilename("slide.pptx")).toBe(false);
    expect(isPdfFilename("../slide.pdf")).toBe(false);
  });

  it("builds keys under mentors/{id}/slide/", () => {
    expect(slideKey("m-1", "a.pdf")).toBe("mentors/m-1/slide/a.pdf");
  });
});

describe("createSlideUploadUrl", () => {
  it("signs a PUT bound to the key, PDF content type and size", async () => {
    await createSlideUploadUrl("m-1", "a.pdf", 1234);

    const command = getSignedUrl.mock.calls[0][1];
    expect(command.input).toEqual({
      Bucket: "private-bucket",
      Key: "mentors/m-1/slide/a.pdf",
      ContentType: "application/pdf",
      ContentLength: 1234,
    });
  });
});

describe("createSlideViewUrl", () => {
  it("signs a GET that renders inline", async () => {
    await createSlideViewUrl("m-1", "資料.pdf");

    const command = getSignedUrl.mock.calls[0][1];
    expect(command.input.Key).toBe("mentors/m-1/slide/資料.pdf");
    expect(command.input.ResponseContentDisposition).toBe(
      `inline; filename*=UTF-8''${encodeURIComponent("資料.pdf")}`,
    );
  });
});

describe("listSlides", () => {
  it("follows pagination, drops non-PDF / nested keys, and sorts newest first", async () => {
    r2.send
      .mockResolvedValueOnce({
        Contents: [
          { Key: "mentors/m-1/slide/old.pdf", Size: 10, LastModified: new Date("2026-01-01") },
          { Key: "mentors/m-1/slide/notes.txt", Size: 1 },
        ],
        IsTruncated: true,
        NextContinuationToken: "t1",
      })
      .mockResolvedValueOnce({
        Contents: [
          { Key: "mentors/m-1/slide/new.pdf", Size: 20, LastModified: new Date("2026-02-01") },
          { Key: "mentors/m-1/slide/sub/x.pdf", Size: 1 },
        ],
        IsTruncated: false,
      });

    const slides = await listSlides("m-1");

    expect(slides.map((s) => s.filename)).toEqual(["new.pdf", "old.pdf"]);
    expect(r2.send.mock.calls[0][0].input).toMatchObject({
      Bucket: "private-bucket",
      Prefix: "mentors/m-1/slide/",
    });
    expect(r2.send.mock.calls[1][0].input.ContinuationToken).toBe("t1");
  });
});

describe("listMentorIdsWithSlides", () => {
  it("collects only mentors that have a PDF directly under slide/", async () => {
    r2.send
      .mockResolvedValueOnce({
        Contents: [
          { Key: "mentors/m-1/slide/a.pdf" },
          { Key: "mentors/m-2/slide/notes.txt" },
        ],
        IsTruncated: true,
        NextContinuationToken: "t1",
      })
      .mockResolvedValueOnce({
        Contents: [
          { Key: "mentors/m-3/other/a.pdf" },
          { Key: "mentors/m-4/slide/sub/a.pdf" },
          { Key: "mentors/m-5/slide/b.PDF" },
        ],
        IsTruncated: false,
      });

    const ids = await listMentorIdsWithSlides();

    expect([...ids].sort()).toEqual(["m-1", "m-5"]);
    expect(r2.send.mock.calls[0][0].input).toMatchObject({ Prefix: "mentors/" });
    expect(r2.send.mock.calls[1][0].input.ContinuationToken).toBe("t1");
  });
});

describe("fetchLatestSlideBytes", () => {
  it("reads the newest PDF under the mentor's slide/ prefix", async () => {
    r2.send
      .mockResolvedValueOnce({
        Contents: [
          { Key: "mentors/m-1/slide/old.pdf", Size: 1, LastModified: new Date("2026-01-01") },
          { Key: "mentors/m-1/slide/new.pdf", Size: 1, LastModified: new Date("2026-03-01") },
        ],
        IsTruncated: false,
      })
      .mockResolvedValueOnce({
        Body: { transformToByteArray: async () => new Uint8Array([9]) },
      });

    const bytes = await fetchLatestSlideBytes("m-1");

    expect(bytes).toEqual(new Uint8Array([9]));
    expect(r2.send.mock.calls[1][0].input).toEqual({
      Bucket: "private-bucket",
      Key: "mentors/m-1/slide/new.pdf",
    });
  });

  it("returns null when the mentor has no slide PDF", async () => {
    r2.send.mockResolvedValueOnce({ Contents: [], IsTruncated: false });

    expect(await fetchLatestSlideBytes("m-1")).toBeNull();
    expect(r2.send).toHaveBeenCalledTimes(1);
  });
});
