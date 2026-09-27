import { describe, it, expect, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { buildMeetingSlide } from "./buildMeetingSlide";
import { PAGE_HEIGHT, PAGE_WIDTH } from "./questionPage";

// 実フォント（src/assets/fonts）と subset-font の WASM を使う統合テスト
const QUESTION_DATA = {
  troubleEpisode: "模試で志望校がE判定が続いています（偏差値50）。",
  unresolvedIssues: "自分に合った具体的な方法がわからないままです。",
  adviceItems: ["基礎問題集を1冊に絞って3周する"],
};

async function makeMentorPdf(pageCount) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) doc.addPage([720, 405]);
  return doc.save();
}

describe("buildMeetingSlide", () => {
  it("appends the question page after every page of the mentor PDF", async () => {
    const bytes = await buildMeetingSlide({
      mentorPdfBytes: await makeMentorPdf(3),
      ...QUESTION_DATA,
    });

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(4);
    expect(doc.getPage(0).getSize()).toEqual({ width: 720, height: 405 });
    expect(doc.getPage(3).getSize()).toEqual({ width: PAGE_WIDTH, height: PAGE_HEIGHT });
  }, 30_000);

  it("returns only the question page when the mentor has no slide PDF", async () => {
    const bytes = await buildMeetingSlide({ mentorPdfBytes: null, ...QUESTION_DATA });

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  }, 30_000);

  it("still returns the question page when the mentor PDF is broken", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const bytes = await buildMeetingSlide({
      mentorPdfBytes: new TextEncoder().encode("not a pdf"),
      ...QUESTION_DATA,
    });

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  }, 30_000);

  it("keeps the embedded fonts small by subsetting", async () => {
    const bytes = await buildMeetingSlide({
      mentorPdfBytes: null,
      troubleEpisode: null,
      unresolvedIssues: "",
      adviceItems: [],
    });
    // フォント本体は各5MB超。使う文字だけに絞れていれば数十KBに収まる
    expect(bytes.length).toBeLessThan(200 * 1024);
  }, 30_000);
});
