import { createClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import OrganizationOwnerDashboard from "@/components/dashboard/organization/OrganizationOwnerDashboard";

// middlewareはこのサブパスを保護しないため、admin配下と同様このページ自身で
// 「呼び出し者が組織ownerか」を再確認する（profiles.roleとは独立した資格のため）
export default async function OrganizationOwnerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ownerRow } = await supabase
    .from("organization_owners")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ownerRow) redirect("/dashboard");

  const organizationId = ownerRow.organization_id;
  const masterSupabase = createAdminSupabaseClient();

  const [
    { data: organization },
    { data: credits },
    { data: members },
    { data: joinRequests },
    { data: logs },
  ] = await Promise.all([
    masterSupabase.from("organizations").select("*").eq("id", organizationId).single(),
    masterSupabase
      .from("organization_credits")
      .select("balance")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    masterSupabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .order("joined_at", { ascending: true }),
    masterSupabase
      .from("organization_join_requests")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("status", "pending")
      .order("requested_at", { ascending: true }),
    masterSupabase
      .from("organization_credit_logs")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  // メンバー・申請者・利用者の表示名をusersテーブルから一括取得（N+1回避）
  const userIds = [
    ...new Set([
      ...(members ?? []).map((m) => m.user_id),
      ...(joinRequests ?? []).map((r) => r.user_id),
      ...(logs ?? []).map((l) => l.spent_by).filter(Boolean),
    ]),
  ];

  const { data: userRows } =
    userIds.length > 0
      ? await masterSupabase.from("users").select("id, name").in("id", userIds)
      : { data: [] };
  const userNameMap = new Map((userRows ?? []).map((u) => [u.id, u.name]));

  const membersWithNames = (members ?? []).map((m) => ({
    ...m,
    name: userNameMap.get(m.user_id) ?? "不明なユーザー",
  }));
  const requestsWithNames = (joinRequests ?? []).map((r) => ({
    ...r,
    name: userNameMap.get(r.user_id) ?? "不明なユーザー",
  }));
  const logsWithNames = (logs ?? []).map((l) => ({
    ...l,
    spentByName: l.spent_by ? (userNameMap.get(l.spent_by) ?? "不明なユーザー") : null,
  }));

  return (
    <OrganizationOwnerDashboard
      organization={organization}
      balance={credits?.balance ?? 0}
      members={membersWithNames}
      joinRequests={requestsWithNames}
      logs={logsWithNames}
    />
  );
}
