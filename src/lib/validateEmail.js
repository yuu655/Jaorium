// メールアドレスの実用的な形式チェック。
// <input type="email"> のHTML5検証やGoTrueの検証は「mkzk.@gmail.com」のような
// ローカル部末尾のドットを許してしまい、SMTP送信段階で失敗して500になる
// （2026-07-15の登録失敗の実例）。RFC 5322のdot-atomに沿って、
// ローカル部はドット区切りのアトム（先頭・末尾・連続ドット禁止）、
// ドメインはドット区切りの有効なラベル（最低2ラベル）を要求する。
const EMAIL_PATTERN =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function isValidEmail(email) {
  return (
    typeof email === "string" && email.length <= 254 && EMAIL_PATTERN.test(email)
  );
}
