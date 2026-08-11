"use server";
import { createClient } from "@/lib/supabase/server";

// ---- 純粋ロジック ----

function normalizeJoinCode(code) {
  return (code ?? "").trim().toUpperCase();
}

// ---- I/O（Supabase呼び出し） ----

async function getCurrentUser(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function fetchActiveMembership(supabase, userId) {
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return data;
}

async function findOrganizationByCode(supabase, code) {
  const { data, error } = await supabase.rpc("find_organization_by_join_code", {
    p_code: code,
  });
  if (error || !data || data.length === 0) return null;
  return data[0];
}

async function insertJoinRequest(supabase, { organizationId, userId }) {
  return supabase
    .from("organization_join_requests")
    .insert({ organization_id: organizationId, user_id: userId, status: "pending" });
}

// ---- Server Action ----

export async function submitJoinRequest(prevState, formData) {
  const code = normalizeJoinCode(formData.get("code"));
  if (!code) {
    return { error: "組織コードを入力してください。" };
  }

  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) {
    return { error: "ログインが必要です。" };
  }

  // 既に別組織のアクティブメンバーなら、それ以上の申請を許可しない
  // （1ユーザー1組織のみ。organization_membersの部分ユニーク制約とも整合）
  const existingMembership = await fetchActiveMembership(supabase, user.id);
  if (existingMembership) {
    return { error: "既に別の組織に所属しています。" };
  }

  const organization = await findOrganizationByCode(supabase, code);
  if (!organization) {
    return { error: "組織コードが正しくありません。" };
  }

  const { error } = await insertJoinRequest(supabase, {
    organizationId: organization.id,
    userId: user.id,
  });

  if (error) {
    // organization_join_requests_one_pending_per_user_org のユニーク制約違反
    if (error.code === "23505") {
      return { error: "既にこの組織へ参加申請中です。" };
    }
    console.error("submitJoinRequest error:", error.message);
    return { error: "申請に失敗しました。もう一度お試しください。" };
  }

  return { success: true, organizationName: organization.name };
}
