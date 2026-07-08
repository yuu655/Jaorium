import { describe, it, expect } from "vitest";
import { counterpartColumnsFor, COUNTERPART_COLUMNS } from "./chatCounterpart";

describe("counterpartColumnsFor", () => {
  it("returns the user-facing columns for a student counterpart", () => {
    expect(counterpartColumnsFor("users")).toBe("id, name, icon, grade, desire");
  });

  it("returns the mentor-facing columns for a mentor counterpart", () => {
    expect(counterpartColumnsFor("mentors")).toBe("id, name, icon, university, faculty");
  });

  it("never exposes the Stripe customer id or a wildcard for any table", () => {
    for (const columns of Object.values(COUNTERPART_COLUMNS)) {
      expect(columns).not.toContain("*");
      expect(columns).not.toContain("customer_id");
      expect(columns).not.toContain("stripe");
    }
  });

  it("falls back to a safe minimal set for an unknown table (never '*')", () => {
    expect(counterpartColumnsFor("something_else")).toBe("id, name, icon");
  });
});
