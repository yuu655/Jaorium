// app/api/meetings/[meetingId]/schedule/route.js
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';


const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_SECRET_KEY
);

export async function PATCH(request, { params }) {
  // 1. APIキー検証
  const {meetingId} = await params;
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.NEXT_APIROUTE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // 4. 操作内容に応じてupdate
  const body = await request.json();
  const { action, date, time } = body;

  let updateData = {};

  switch (action) {
    case 'set_schedule':
    //   if (meeting.mentor !== user.id) {
    //     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    //   }
      updateData = { date, time, is_commit: true };
      break;

    case 'delete_schedule':
    //   if (meeting.mentor !== user.id) {
    //     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    //   }
      updateData = { date: null, time: null, is_commit: false };
      break;
    
    case 'finish':
      updateData = { is_finished: true };
      break;

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
  // console.log(meetingID)
  const { data, error } = await supabaseAdmin
    .from('meeting_schedules')
    .update(updateData)
    .eq('meeting_id', meetingId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}