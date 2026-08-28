// ヘッダーのナビゲーション定義。デスクトップ(headerNav)とモバイル(mobileMenu)の双方から参照する。
export const NAV_LINKS = [
  { name: "コンセプト", href: "/concept" },
  { name: "メンター紹介", href: "/mentors" },
  { name: "記事", href: "/articles/1" },
];

// 「各種の方へ」の対象者別リンク。
// デザインにある「保護者の方へ」「高校教員の方へ」は対応ページが未作成のため、
// ページを追加したタイミングでここに足せば両方のメニューに反映される。
export const AUDIENCE_LINKS = [
  {
    name: "メンター希望の方へ",
    href: "/recruitment",
    description: "大学生としてメンターに登録する",
  },
  {
    name: "企業・塾の方へ",
    href: "/forCompanies",
    description: "塾・予備校・企業との提携について",
  },
];
