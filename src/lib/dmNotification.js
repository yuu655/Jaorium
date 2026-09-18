// DM通知メールを送るかどうかの判定。
// Web Pushと違い、メールは受信箱に残り続けるので、次の2つで間引く。
//   1. 直近 DM_EMAIL_THROTTLE_MIN 分に同じ相手へ送っていたら送らない
//   2. 相手が既にそのメッセージを読んでいたら送らない
// 既読状態は meeting_reads（meeting_id, user_id, last_read_at, last_notified_at）で持つ。

export const DM_EMAIL_THROTTLE_MIN = 30;

// チャットを開いている間はクライアントが last_read_at を更新し続けるが、
// webhookはINSERT直後に走るので、相手の既読更新が間に合わないことがある。
// 直前まで開いていた相手は「見ている」とみなしてメールを送らない。
export const DM_ACTIVE_WINDOW_MIN = 2;

function toTime(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export function shouldSendDmEmail({
  lastReadAt,
  lastNotifiedAt,
  messageCreatedAt,
  now = new Date(),
}) {
  const nowTime = now.getTime();
  const notified = toTime(lastNotifiedAt);
  const read = toTime(lastReadAt);
  const created = toTime(messageCreatedAt) ?? nowTime;

  if (notified != null && nowTime - notified < DM_EMAIL_THROTTLE_MIN * 60_000) {
    return { send: false, reason: "throttled" };
  }

  if (read != null) {
    // メッセージより後に読んでいる＝もう見ている
    if (read >= created) return { send: false, reason: "already_read" };
    if (nowTime - read < DM_ACTIVE_WINDOW_MIN * 60_000) {
      return { send: false, reason: "recently_active" };
    }
  }

  return { send: true, reason: "unread" };
}
