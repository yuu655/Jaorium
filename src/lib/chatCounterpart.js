// チャット相手（counterpart）としてクライアントに渡してよい列だけを定義する。
// users.customer_id（Stripe顧客ID）のような機密列を select("*") で
// 巻き込んでクライアントへ露出させないための許可リスト。
// Chat.js が実際に参照するのは id / name / icon と、
// users: grade・desire / mentors: university・faculty のみ。
export const COUNTERPART_COLUMNS = {
  users: "id, name, icon, grade, desire",
  mentors: "id, name, icon, university, faculty",
};

export function counterpartColumnsFor(table) {
  return COUNTERPART_COLUMNS[table] ?? "id, name, icon";
}
