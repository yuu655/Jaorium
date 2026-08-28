import { describe, it, expect } from "vitest";
import {
  DEFAULT_PAGE_SIZE,
  getTotalPages,
  clampPage,
  paginate,
  getPageItems,
} from "./pagination";

const many = Array.from({ length: 65 }, (_, i) => ({ id: i }));

describe("paginate", () => {
  it("puts 30 items on a page by default", () => {
    expect(DEFAULT_PAGE_SIZE).toBe(30);
    expect(paginate(many, 1)).toHaveLength(30);
    expect(paginate(many, 3)).toHaveLength(5);
  });

  it("slices the requested page", () => {
    expect(paginate(many, 2)[0].id).toBe(30);
  });

  it("honours a custom page size", () => {
    expect(paginate(many, 1, 9)).toHaveLength(9);
    expect(paginate(many, 2, 9)[0].id).toBe(9);
  });

  it("falls back to the last page when the page is out of range", () => {
    expect(paginate(many, 99)).toHaveLength(5);
  });

  it("returns an empty page for an empty list", () => {
    expect(paginate([], 1)).toEqual([]);
  });
});

describe("getTotalPages", () => {
  it("counts pages with a minimum of one", () => {
    expect(getTotalPages(65)).toBe(3);
    expect(getTotalPages(30)).toBe(1);
    expect(getTotalPages(0)).toBe(1);
    expect(getTotalPages(undefined)).toBe(1);
  });

  it("honours a custom page size", () => {
    expect(getTotalPages(65, 9)).toBe(8);
  });
});

describe("clampPage", () => {
  it("clamps out-of-range page numbers", () => {
    expect(clampPage(0, 3)).toBe(1);
    expect(clampPage(9, 3)).toBe(3);
    expect(clampPage(2, 3)).toBe(2);
  });
});

describe("getPageItems", () => {
  it("lists every page when there are few", () => {
    expect(getPageItems(1, 3)).toEqual([1, 2, 3]);
  });

  it("collapses long page ranges with ellipses", () => {
    expect(getPageItems(6, 20)).toEqual([1, "ellipsis", 5, 6, 7, "ellipsis", 20]);
    expect(getPageItems(2, 20)).toEqual([1, 2, 3, "ellipsis", 20]);
    expect(getPageItems(20, 20)).toEqual([1, "ellipsis", 19, 20]);
  });

  it("returns a single page for a single-page list", () => {
    expect(getPageItems(1, 1)).toEqual([1]);
  });
});
