import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

async function createSessionClient(cookieStore) {
  return createServerClient(
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
}

async function isCallerAdmin(supabase, userId) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return !error && profile?.role === 'admin'
}

async function approveMentor(mentorId) {
  const adminClient = createAdminSupabaseClient()
  return adminClient.from('mentors').update({ is_allowed: true }).eq('id', mentorId)
}

export async function POST(request) {
  const { searchParams } = new URL(request.url)
  const mentorId = searchParams.get('id')
  const cookieStore = await cookies()
  const supabase = await createSessionClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await isCallerAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await approveMentor(mentorId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
