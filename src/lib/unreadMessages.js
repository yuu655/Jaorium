// 未読件数と既読判定。meeting_reads.last_read_at を基準にする。
// 「相手が送った」「last_read_at より後」「削除されていない」メッセージを未読と数える。

function toTime(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

// meeting_reads の行を { [meetingId]: last_read_at } にまとめる
export function groupReadsByMeeting(rows) {
  return (rows ?? []).reduce((acc, row) => {
    if (!row?.meeting_id) return acc;
    acc[row.meeting_id] = row.last_read_at ?? null;
    return acc;
  }, {});
}

export function isUnreadMessage(message, { userId, lastReadAt }) {
  if (!message || message.sender_id === userId) return false;
  if (message.deleted_at) return false;

  const read = toTime(lastReadAt);
  if (read == null) return true; // 一度も開いていない

  const created = toTime(message.created_at);
  return created == null ? false : created > read;
}

// { [meetingId]: 未読件数 }。0件の面談はキーごと落とす。
export function countUnreadByMeeting({ messages, readsByMeeting = {}, userId }) {
  return (messages ?? []).reduce((acc, message) => {
    const meetingId = message?.meeting_id;
    if (!meetingId) return acc;
    if (!isUnreadMessage(message, { userId, lastReadAt: readsByMeeting[meetingId] })) return acc;
    acc[meetingId] = (acc[meetingId] ?? 0) + 1;
    return acc;
  }, {});
}

export function totalUnread(unreadByMeeting) {
  return Object.values(unreadByMeeting ?? {}).reduce((sum, n) => sum + n, 0);
}

// バッジの表示文字列。99件を超えたら "99+" に丸める
export function formatUnreadBadge(count) {
  if (!count || count < 1) return null;
  return count > 99 ? "99+" : String(count);
}

// 自分が送ったメッセージを相手が読んだか（チャットの既読表示）
export function isReadByCounterpart(message, counterpartLastReadAt) {
  const read = toTime(counterpartLastReadAt);
  const created = toTime(message?.created_at);
  if (read == null || created == null) return false;
  return read >= created;
}

// ダッシュボードの未読バッジ用。unstable_cache の外から呼ぶこと（未読は変化が速く、
// 60秒キャッシュに載せると開いたのにバッジが残る）。
export async function fetchUnreadByMeeting(supabase, { userId, meetingIds }) {
  const ids = meetingIds ?? [];
  if (ids.length === 0) return {};

  const [{ data: messages }, { data: reads }] = await Promise.all([
    supabase
      .from("messages")
      .select("meeting_id, sender_id, created_at, deleted_at")
      .in("meeting_id", ids),
    supabase
      .from("meeting_reads")
      .select("meeting_id, last_read_at")
      .eq("user_id", userId)
      .in("meeting_id", ids),
  ]);

  return countUnreadByMeeting({
    messages: messages ?? [],
    readsByMeeting: groupReadsByMeeting(reads),
    userId,
  });
}

// 既読マークを付けるメッセージのID。自分が送った中で相手が読んだ最後の1通。
// 全部に付けると縦に並んで読みづらいので1つだけに絞る。
// 「Aを読まれた後にBを送った」場合はAに付く（Bはまだ未読）。
export function lastReadMessageId({ messages, userId, counterpartReadAt }) {
  for (let i = (messages ?? []).length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.sender_id !== userId) continue;
    if (isReadByCounterpart(message, counterpartReadAt)) return message.id;
  }
  return null;
}
