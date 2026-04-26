import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request) {
    const { searchParams } = new URL(request.url);
  const mentor_id = searchParams.get('id');
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
//   console.log('user:', user?.id)
//   console.log('userError:', userError)

  if (user?.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_SECRET_KEY
  )

  const { error: error_update } = await adminClient
    .from("mentors")
    .update({
      is_allowed: true,
    })
    .eq("id", mentor_id);
//   console.log('deleteError:', JSON.stringify(error, null, 2)) // ← ここが重要

  if (error_update) {
    return NextResponse.json({ error: error_update.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}