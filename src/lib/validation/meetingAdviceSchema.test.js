import { describe, it, expect } from "vitest";
import { ADVICE_ITEM_MAX_LENGTH, meetingAdviceSchema } from "./meetingAdviceSchema";

describe("meetingAdviceSchema", () => {
  it("trims items and drops empty ones so the rest move up", () => {
    expect(meetingAdviceSchema.parse(["", "  a  ", " "])).toEqual(["a"]);
  });

  it("rejects saving with every field empty", () => {
    const result = meetingAdviceSchema.safeParse(["", "  ", ""]);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("アドバイスを1つ以上入力してください。");
  });

  it("rejects more than 3 items", () => {
    expect(meetingAdviceSchema.safeParse(["a", "b", "c", "d"]).success).toBe(false);
  });

  it("rejects an item over the length limit", () => {
    const result = meetingAdviceSchema.safeParse(["あ".repeat(ADVICE_ITEM_MAX_LENGTH + 1)]);
    expect(result.success).toBe(false);
  });

  it("rejects a non-array value", () => {
    expect(meetingAdviceSchema.safeParse("a").success).toBe(false);
  });
});
