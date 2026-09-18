// 通知メールの本文にユーザーが書いた文字列をそのまま差し込むと、相手の受信箱で
// タグとして解釈されてしまう。メールHTMLを組み立てる箇所はこれを通す。
export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
