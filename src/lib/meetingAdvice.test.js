import { describe, it, expect } from "vitest";
import { adviceInputPath, mentorMustEnterAdvice } from "./meetingAdvice";

describe("mentorMustEnterAdvice", () => {
  it("blocks the mentor of an ongoing meeting until advice is saved", () => {
    expect(mentorMustEnterAdvice({ isMentor: true, isFinished: false, adviceItems: [] })).toBe(true);
    expect(mentorMustEnterAdvice({ isMentor: true, isFinished: false, adviceItems: null })).toBe(true);
  });

  it("lets the mentor in once at least one advice item exists", () => {
    expect(mentorMustEnterAdvice({ isMentor: true, isFinished: false, adviceItems: ["a"] })).toBe(false);
  });

  it("never blocks the user side", () => {
    expect(mentorMustEnterAdvice({ isMentor: false, isFinished: false, adviceItems: [] })).toBe(false);
  });

  it("does not block finished meetings", () => {
    expect(mentorMustEnterAdvice({ isMentor: true, isFinished: true, adviceItems: [] })).toBe(false);
  });
});

describe("adviceInputPath", () => {
  it("marks the redirect so the page can explain why it opened", () => {
    expect(adviceInputPath("m-1")).toBe("/dashboard/mentor/advice/m-1");
    expect(adviceInputPath("m-1", { required: true })).toBe("/dashboard/mentor/advice/m-1?required=1");
  });
});
