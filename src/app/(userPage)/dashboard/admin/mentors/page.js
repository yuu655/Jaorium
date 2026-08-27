import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminMentorList from "@/components/dashboard/admin/AdminMentorList";

const AUTH_USERS_PAGE_SIZE = 1000;

// auth.admin.listUsersは1回の呼び出しで返る件数に上限があるため、
// 満杯のページが返る限り次ページを取りに行って全ユーザーを集める。
async function fetchAllAuthUsers(masterSupabase) {
  const allUsers = [];

  for (let page = 1; ; page++) {
    const { data, error } = await masterSupabase.auth.admin.listUsers({
      page,
      perPage: AUTH_USERS_PAGE_SIZE,
    });

    if (error) {
      console.error("listUsers error:", error.message);
      break;
    }

    const users = data?.users ?? [];
    allUsers.push(...users);
    if (users.length < AUTH_USERS_PAGE_SIZE) break;
  }

  return allUsers;
}

export default async function AdminMentorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const masterSupabase = createAdminSupabaseClient();

  // mentor_secretはRLSで本人しか読めないため、service roleで取得する
  const [{ data: mentors }, { data: secrets }, authUsers] = await Promise.all([
    masterSupabase.from("mentors").select("id, name").order("created_at", { ascending: false }),
    masterSupabase.from("mentor_secret").select("id, admin_allow"),
    fetchAllAuthUsers(masterSupabase),
  ]);

  const adminAllowMap = new Map((secrets ?? []).map((s) => [s.id, s.admin_allow]));
  const emailMap = new Map(authUsers.map((u) => [u.id, u.email]));

  // 一覧に出すのは名前・アドレス・承認状態の3項目のみ（idは操作用）
  const mentorRows = (mentors ?? []).map((mentor) => ({
    id: mentor.id,
    name: mentor.name ?? "(名前未設定)",
    email: emailMap.get(mentor.id) ?? "(不明)",
    adminAllow: adminAllowMap.get(mentor.id) ?? false,
  }));

  return <AdminMentorList mentors={mentorRows} />;
}
