import { describe, it, expect } from "vitest";
import { parseSearchTerms, filterMentors } from "./mentorFilter";

const tags = [
  { id: 1, name: "文系", category: "uni" },
  { id: 2, name: "部活・サークル", category: "life" },
  { id: 3, name: "一般入試", category: "exam" },
];

const mentors = [
  { id: "a", name: "山田太郎", university: "東京大学", faculty: "法学部" },
  { id: "b", name: "Sato Hanako", university: "Waseda University", faculty: "商学部" },
  { id: "c", name: "鈴木一郎", university: "京都大学", faculty: null },
];

const mentorTagsMap = {
  a: [{ tag_id: 1 }, { tag_id: 3 }],
  b: [{ tag_id: 2 }],
  // c はタグなし
};

const filter = (overrides) =>
  filterMentors({ mentors, mentorTagsMap, tags, ...overrides });

describe("parseSearchTerms", () => {
  it("splits on half-width and full-width spaces and drops empty terms", () => {
    expect(parseSearchTerms(" 東大　文系  法学 ")).toEqual([
      "東大",
      "文系",
      "法学",
    ]);
  });

  it("returns no terms for an empty or whitespace-only query", () => {
    expect(parseSearchTerms("")).toEqual([]);
    expect(parseSearchTerms("　 ")).toEqual([]);
  });

  it("normalizes case and full-width alphanumerics", () => {
    expect(parseSearchTerms("Ｗａｓｅｄａ")).toEqual(["waseda"]);
  });
});

describe("filterMentors", () => {
  it("returns every mentor when there is no query and no tag", () => {
    expect(filter({})).toHaveLength(mentors.length);
  });

  it("matches case-insensitively (the query is normalized too)", () => {
    expect(filter({ searchTerm: "WASEDA" }).map((m) => m.id)).toEqual(["b"]);
  });

  it("requires every space-separated term to match (AND search)", () => {
    expect(filter({ searchTerm: "東京大学 法学" }).map((m) => m.id)).toEqual([
      "a",
    ]);
    expect(filter({ searchTerm: "東京大学 商学" })).toEqual([]);
  });

  it("treats a full-width space as a separator", () => {
    expect(filter({ searchTerm: "東京大学　法学" }).map((m) => m.id)).toEqual([
      "a",
    ]);
  });

  it("searches tag names as free text", () => {
    expect(filter({ searchTerm: "部活" }).map((m) => m.id)).toEqual(["b"]);
  });

  it("does not throw on mentors with null fields", () => {
    expect(() => filter({ searchTerm: "鈴木" })).not.toThrow();
    expect(filter({ searchTerm: "鈴木" }).map((m) => m.id)).toEqual(["c"]);
  });

  it("narrows to mentors carrying every selected tag", () => {
    expect(filter({ selectedTags: [1, 3] }).map((m) => m.id)).toEqual(["a"]);
    expect(filter({ selectedTags: [1, 2] })).toEqual([]);
  });

  it("excludes mentors with no tags at all when a tag is selected", () => {
    expect(filter({ selectedTags: [1] }).map((m) => m.id)).toEqual(["a"]);
  });

  it("combines tag and text filters", () => {
    expect(filter({ selectedTags: [1], searchTerm: "東京" }).map((m) => m.id)).toEqual([
      "a",
    ]);
    expect(filter({ selectedTags: [1], searchTerm: "京都" })).toEqual([]);
  });

  it("tolerates missing collections", () => {
    expect(
      filterMentors({ mentors: undefined, searchTerm: "東大" }),
    ).toEqual([]);
  });
});
