import { describe, it, expect } from "vitest";
import { ELLIPSIS, fitText, wrapText } from "./wrapText";

// 1文字 = size の幅とみなす等幅フォント
const monoFont = { widthOfTextAtSize: (text, size) => Array.from(text).length * size };

describe("wrapText", () => {
  it("breaks Japanese text per character when it exceeds the width", () => {
    expect(wrapText("あいうえおかきく", monoFont, 10, 30)).toEqual(["あいう", "えおか", "きく"]);
  });

  it("keeps explicit line breaks as paragraph boundaries", () => {
    expect(wrapText("あい\r\nう\n\nえ", monoFont, 10, 100)).toEqual(["あい", "う", "", "え"]);
  });

  it("does not split surrogate pairs", () => {
    expect(wrapText("𠮷𠮷𠮷", monoFont, 10, 20)).toEqual(["𠮷𠮷", "𠮷"]);
  });
});

describe("fitText", () => {
  const box = { maxWidth: 100, maxHeight: 30, lineHeightRatio: 1, step: 1 };

  it("keeps the max size when the text already fits", () => {
    const result = fitText("あいう", monoFont, { ...box, maxSize: 10, minSize: 5 });
    expect(result).toMatchObject({ size: 10, lines: ["あいう"] });
  });

  it("shrinks the font until the text fits the box", () => {
    // size 10: 1行10文字 × 3行 = 30文字まで。40文字なら縮める必要がある
    const result = fitText("あ".repeat(40), monoFont, { ...box, maxSize: 10, minSize: 5 });
    expect(result.size).toBeLessThan(10);
    expect(result.lines.length * result.lineHeight).toBeLessThanOrEqual(30);
    expect(result.lines.join("")).toBe("あ".repeat(40));
  });

  it("truncates with an ellipsis when even the min size overflows", () => {
    // size 5: 1行20文字 × 6行 = 120文字まで
    const result = fitText("あ".repeat(500), monoFont, { ...box, maxSize: 10, minSize: 5 });
    expect(result.size).toBe(5);
    expect(result.lines).toHaveLength(6);
    expect(result.lines[5].endsWith(ELLIPSIS)).toBe(true);
    expect(monoFont.widthOfTextAtSize(result.lines[5], 5)).toBeLessThanOrEqual(100);
  });
});
