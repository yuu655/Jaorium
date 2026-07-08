// app/api/meetings/[meetingId]/schedule/route.js
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const supabaseAdmin = createAdminSupabaseClient();

function buildScheduleUpdate(action, { date, time }) {
  switch (action) {
    case 'set_schedule':
      return { date, time, is_commit: true };
    case 'delete_schedule':
      return { date: null, time: null, is_commit: false };
    case 'finish':
      return { is_finished: true };
    default:
      return null;
  }
}

export async function PATCH(request, { params }) {
  // 1. APIキー検証
  const { meetingId } = await params;
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.NEXT_APIROUTE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action, date, time } = body;

  const updateData = buildScheduleUpdate(action, { date, time });
  if (!updateData) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

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
