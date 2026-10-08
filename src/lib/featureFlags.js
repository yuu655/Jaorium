// 機能のON/OFFをまとめて切り替えるフラグ。
// 関数にしているのは、テストで vi.mock して両方の挙動を確かめられるようにするため。

// メンターの「面談可能日時」。OFFの間は:
// - メンターのサイドバーから項目を消し、/dashboard/mentor/availability はダッシュボードへ戻す
// - 登録済みの枠は読まないので、予約フォーム・チャットの日時提案は「未設定」と同じく自由に選べる
//   （他の面談で確定済みの枠との重複チェックはこのフラグとは無関係に効く）
// 登録済みデータ（mentor_availabilities）は消さないので、trueに戻せばそのまま復帰する。
export function isMentorAvailabilityEnabled() {
  return false;
}
