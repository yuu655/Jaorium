import { describe, it, expect } from "vitest";
import { isValidEmail } from "./validateEmail";

describe("isValidEmail", () => {
  it.each([
    "user@example.com",
    "yukidaruma.mkzk@gmail.com",
    "first.last+tag@sub.example.co.jp",
    "a_b-c@example.io",
  ])("accepts valid address: %s", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    // 2026-07-15に実際に500を引き起こしたパターン（ローカル部末尾のドット）
    "yukidaruma.mkzk.@gmail.com",
    ".leading.dot@gmail.com",
    "double..dot@gmail.com",
    "no-at-sign.example.com",
    "user@",
    "user@nodot",
    "user@-bad-label.com",
    "user@example.com ",
    " user@example.com",
    "user name@example.com",
    "",
  ])("rejects invalid address: %s", (email) => {
    expect(isValidEmail(email)).toBe(false);
  });

  it("rejects non-string input", () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(123)).toBe(false);
  });
});
