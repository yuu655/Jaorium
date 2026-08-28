// 一覧のページ送り用の共通ヘルパー。メンター一覧に限らず使える純粋関数。

export const DEFAULT_PAGE_SIZE = 30;

export const getTotalPages = (totalCount, pageSize = DEFAULT_PAGE_SIZE) =>
  Math.max(1, Math.ceil((totalCount ?? 0) / pageSize));

// ページ番号は1始まり。範囲外を渡されても先頭/末尾ページに丸める。
export const clampPage = (page, totalPages) =>
  Math.min(Math.max(1, page || 1), totalPages);

export const paginate = (items = [], page = 1, pageSize = DEFAULT_PAGE_SIZE) => {
  const start =
    (clampPage(page, getTotalPages(items.length, pageSize)) - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

// 表示するページ番号 (…で省略)。例: 1 … 5 6 7 … 20
export const getPageItems = (currentPage, totalPages, siblings = 1) => {
  const pages = new Set([1, totalPages]);
  for (let p = currentPage - siblings; p <= currentPage + siblings; p += 1) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((page, index) => {
    const prev = sorted[index - 1];
    return prev && page - prev > 1 ? ["ellipsis", page] : [page];
  });
};
