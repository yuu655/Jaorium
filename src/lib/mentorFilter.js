// メンター検索(フリーワード + タグ)の共通ロジック。
// UIを持たない純粋関数なので、mentorSearch.js から呼び出しつつ単体テストできる。
// ページ送りのヘルパーは一覧全般で使うので @/lib/pagination に置いている。

// tags配列を id -> タグ のMapに。カード表示でタグ名を引くのに使う。
export const buildTagById = (tags = []) =>
  Object.fromEntries((tags ?? []).map((tag) => [tag.id, tag]));

// mentorTagsMap(中間テーブルの行)を、カード表示用のタグ配列に変換する。
// 一覧側でまとめて取得済みのデータを使うので、カードごとの追加クエリは不要。
export const getMentorTags = (mentorId, mentorTagsMap, tagById) =>
  (mentorTagsMap?.[mentorId] ?? [])
    .map(({ tag_id }) => tagById?.[tag_id])
    .filter(Boolean);

// 全角/半角、大文字/小文字の揺れを吸収する。NFKCで全角英数→半角、全角スペース→半角スペースになる。
export const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .toLowerCase();

// 半角・全角スペース区切りでAND検索。空文字は捨てるので "東大  文系 " のような入力でも壊れない。
export const parseSearchTerms = (searchTerm) =>
  normalizeText(searchTerm)
    .split(/[\s　]+/)
    .filter(Boolean);

// フリーワードの検索対象。タグ名も含めるので「早稲田 部活」のような横断検索ができる。
const buildHaystack = (mentor, tagNames) =>
  normalizeText(
    [mentor?.name, mentor?.university, mentor?.faculty, ...tagNames].join(" "),
  );

export const filterMentors = ({
  mentors = [],
  mentorTagsMap = {},
  tags = [],
  searchTerm = "",
  selectedTags = [],
}) => {
  const terms = parseSearchTerms(searchTerm);
  if (terms.length === 0 && selectedTags.length === 0) return mentors ?? [];

  const tagNameById = new Map((tags ?? []).map((tag) => [tag.id, tag.name]));

  return (mentors ?? []).filter((mentor) => {
    const mentorTagIds = (mentorTagsMap?.[mentor.id] ?? []).map(
      ({ tag_id }) => tag_id,
    );

    // 選択タグはすべて満たすメンターのみ(絞り込み)。
    const matchesTags = selectedTags.every((tagId) =>
      mentorTagIds.includes(tagId),
    );
    if (!matchesTags) return false;

    if (terms.length === 0) return true;

    const haystack = buildHaystack(
      mentor,
      mentorTagIds.map((tagId) => tagNameById.get(tagId)).filter(Boolean),
    );
    return terms.every((term) => haystack.includes(term));
  });
};
