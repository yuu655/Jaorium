import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminOrganizations from "@/components/dashboard/admin/AdminOrganizations";

export default async function AdminOrganizationsPage() {
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

  const [{ data: organizations }, { data: credits }, { data: owners }, { data: members }] =
    await Promise.all([
      masterSupabase
        .from("organizations")
        .select("*")
        .neq("status", "archived")
        .order("created_at", { ascending: false }),
      masterSupabase.from("organization_credits").select("organization_id, balance"),
      masterSupabase.from("organization_owners").select("organization_id, user_id"),
      masterSupabase.from("organization_members").select("organization_id").eq("status", "active"),
    ]);

  const ownerUserIds = [...new Set((owners ?? []).map((o) => o.user_id))];
  const { data: ownerUsers } =
    ownerUserIds.length > 0
      ? await masterSupabase.auth.admin.listUsers()
      : { data: { users: [] } };
  const ownerEmailMap = new Map(
    (ownerUsers?.users ?? [])
      .filter((u) => ownerUserIds.includes(u.id))
      .map((u) => [u.id, u.email]),
  );

  const balanceMap = new Map((credits ?? []).map((c) => [c.organization_id, c.balance]));
  const memberCountMap = new Map();
  (members ?? []).forEach((m) => {
    memberCountMap.set(m.organization_id, (memberCountMap.get(m.organization_id) ?? 0) + 1);
  });
  const ownersByOrg = new Map();
  (owners ?? []).forEach((o) => {
    const list = ownersByOrg.get(o.organization_id) ?? [];
    list.push({ userId: o.user_id, email: ownerEmailMap.get(o.user_id) ?? o.user_id });
    ownersByOrg.set(o.organization_id, list);
  });

  const organizationsWithStats = (organizations ?? []).map((org) => ({
    ...org,
    balance: balanceMap.get(org.id) ?? 0,
    memberCount: memberCountMap.get(org.id) ?? 0,
    owners: ownersByOrg.get(org.id) ?? [],
  }));

  return <AdminOrganizations organizations={organizationsWithStats} />;
}
