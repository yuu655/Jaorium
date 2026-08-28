// 公開メンター一覧(public_mentors + tags + mentor_tags + review_sum)の取得。
//
// 以前はメンター1人ごとに mentor_tags / review_sum を引いていたため、
// メンターM人で 2 + 2M 回のクエリが飛んでいた(N+1)。ここでは関連テーブルを
// まとめて取り、メモリ上でメンターIDごとに振り分けるので常に4クエリで済む。

// PostgRESTは1リクエストで返す行数に上限(既定1000行)があるため、
// 満杯のページが返る限り次の範囲を取りに行って全行を集める。
export const SUPABASE_MAX_ROWS = 1000;

export async function fetchAllRows(buildQuery, pageSize = SUPABASE_MAX_ROWS) {
  const rows = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await buildQuery().range(
      offset,
      offset + pageSize - 1,
    );

    if (error) {
      console.error("fetchAllRows error:", error.message);
      break;
    }

    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  return rows;
}

const hasIcon = (mentor) => Boolean(mentor?.icon);

export async function fetchMentorDirectory(supabase) {
  // mentor_secretはRLSで本人しか読めず、一般ユーザー・未ログインからは0行になる。
  // admin_allowでの絞り込みはpublic_mentorsビュー(公開カラムのみ)に任せる。
  const [mentors, tags, mentorTags, reviewSums] = await Promise.all([
    fetchAllRows(() => supabase.from("public_mentors").select("*")),
    fetchAllRows(() => supabase.from("tags").select("*")),
    fetchAllRows(() => supabase.from("mentor_tags").select("mentor_id, tag_id")),
    fetchAllRows(() => supabase.from("review_sum").select("mentor_id, star_avg")),
  ]);

  // タグ0件のメンターも空配列で引けるよう、先に全メンター分の枠を作る。
  const mentorTagsMap = Object.fromEntries(mentors.map(({ id }) => [id, []]));
  for (const { mentor_id, tag_id } of mentorTags) {
    // 非公開メンター(public_mentorsに出てこない)の行は捨てる。
    if (mentorTagsMap[mentor_id]) mentorTagsMap[mentor_id].push({ tag_id });
  }

  const starAvgById = new Map(
    reviewSums.map(({ mentor_id, star_avg }) => [mentor_id, star_avg]),
  );

  // アイコンを設定しているメンターを先に表示する(同条件内の順序は元のまま)。
  const sortedMentors = mentors
    .map((mentor) => ({
      ...mentor,
      review_sum: starAvgById.get(mentor.id) || 0,
    }))
    .sort((a, b) => hasIcon(b) - hasIcon(a));

  return { mentors: sortedMentors, tags, mentorTagsMap };
}
