-- DM通知メールの間引き用。面談ごと・ユーザーごとに
--   last_read_at    : そのユーザーがチャットを最後に開いた時刻
--   last_notified_at: そのユーザーへ最後に通知メールを送った時刻
-- を持つ。既読・未読の表示には今のところ使っていない。

create table if not exists public.meeting_reads (
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  last_read_at timestamptz,
  last_notified_at timestamptz,
  primary key (meeting_id, user_id)
);

alter table public.meeting_reads enable row level security;

-- SELECTは面談の参加者どうしで相互に見られる（相手の last_read_at が既読表示の根拠）。
-- 見えるのは時刻だけで、メッセージ本文は含まれない。
create policy "meeting_reads_select_participants"
  on public.meeting_reads for select
  using (
    exists (
      select 1 from public.meetings m
      where m.id = meeting_id and (m.user = auth.uid() or m.mentor = auth.uid())
    )
  );

create policy "meeting_reads_insert_own"
  on public.meeting_reads for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.meetings m
      where m.id = meeting_id and (m.user = auth.uid() or m.mentor = auth.uid())
    )
  );

create policy "meeting_reads_update_own"
  on public.meeting_reads for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- last_notified_at は service role（webhook）だけが書く。

-- 既読表示をリアルタイムに反映するため、publicationに載せる
alter publication supabase_realtime add table public.meeting_reads;
