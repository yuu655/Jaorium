"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const resend = new Resend(process.env.SMTP_API_KEY);

// ---- 純粋ロジック ----

function generateJoinCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

function isUniqueViolation(error) {
  return error?.code === "23505";
}

// ---- I/O（Supabase呼び出し） ----

async function getCurrentUser(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// service-roleでの更新前に必ず「呼び出し者が対象組織のownerか」をここで再検証する
// （consumeCredit/api-mentor-routeと同じ「RLS迂回時は手動で権限確認する」パターン）
async function verifyOwnership(supabase, { userId, organizationId }) {
  const { data } = await supabase
    .from("organization_owners")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  return Boolean(data);
}

async function requireOwner(organizationId) {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { error: "ログインが必要です。" };
  if (!(await verifyOwnership(supabase, { userId: user.id, organizationId }))) {
    return { error: "権限がありません。" };
  }
  return { user };
}

// ---- Server Actions（オーケストレーション） ----

export async function approveJoinRequest(requestId, organizationId) {
  const auth = await requireOwner(organizationId);
  if (auth.error) return auth;

  const masterSupabase = createAdminSupabaseClient();
  const { error } = await masterSupabase.rpc("approve_join_request", {
    p_request_id: requestId,
    p_decided_by: auth.user.id,
  });

  if (error) {
    if (error.message?.includes("ALREADY_MEMBER")) {
      return { error: "このユーザーは既に別の組織のメンバーです。" };
    }
    console.error("approveJoinRequest error:", error.message);
    return { error: "承認に失敗しました。" };
  }

  revalidatePath("/dashboard/organization");
  return { success: true };
}

export async function rejectJoinRequest(requestId, organizationId) {
  const auth = await requireOwner(organizationId);
  if (auth.error) return auth;

  const masterSupabase = createAdminSupabaseClient();
  const { error } = await masterSupabase
    .from("organization_join_requests")
    .update({ status: "rejected", decided_at: new Date().toISOString(), decided_by: auth.user.id })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) {
    console.error("rejectJoinRequest error:", error.message);
    return { error: "却下に失敗しました。" };
  }

  revalidatePath("/dashboard/organization");
  return { success: true };
}

export async function removeMember(memberId, organizationId) {
  const auth = await requireOwner(organizationId);
  if (auth.error) return auth;

  const masterSupabase = createAdminSupabaseClient();
  const { error } = await masterSupabase
    .from("organization_members")
    .update({ status: "removed", removed_at: new Date().toISOString() })
    .eq("id", memberId)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("removeMember error:", error.message);
    return { error: "削除に失敗しました。" };
  }

  revalidatePath("/dashboard/organization");
  return { success: true };
}

// limitがnull/空なら無制限に戻す
export async function setMemberCreditLimit(memberId, organizationId, limit) {
  const parsedLimit = limit === null || limit === "" ? null : Number(limit);
  if (parsedLimit !== null && (!Number.isInteger(parsedLimit) || parsedLimit < 0)) {
    return { error: "上限は0以上の整数で入力してください。" };
  }

  const auth = await requireOwner(organizationId);
  if (auth.error) return auth;

  const masterSupabase = createAdminSupabaseClient();
  const { error } = await masterSupabase
    .from("organization_members")
    .update({ credit_limit: parsedLimit })
    .eq("id", memberId)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("setMemberCreditLimit error:", error.message);
    return { error: "上限の設定に失敗しました。" };
  }

  revalidatePath("/dashboard/organization");
  return { success: true };
}

export async function regenerateJoinCode(organizationId) {
  const auth = await requireOwner(organizationId);
  if (auth.error) return auth;

  const masterSupabase = createAdminSupabaseClient();

  // join_codeはUNIQUE制約があるため、衝突時は数回リトライする
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateJoinCode();
    const { error } = await masterSupabase
      .from("organizations")
      .update({ join_code: code })
      .eq("id", organizationId);

    if (!error) {
      revalidatePath("/dashboard/organization");
      return { success: true, joinCode: code };
    }
    if (!isUniqueViolation(error)) {
      console.error("regenerateJoinCode error:", error.message);
      return { error: "コードの再発行に失敗しました。" };
    }
  }

  return { error: "コードの再発行に失敗しました。もう一度お試しください。" };
}

export async function requestCreditTopUp(organizationId, note) {
  const auth = await requireOwner(organizationId);
  if (auth.error) return auth;

  const masterSupabase = createAdminSupabaseClient();
  const { data: organization } = await masterSupabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .single();

  try {
    await resend.emails.send({
      from: "jaorium_contact@jaorium.com",
      to: "kazuto335.yama@gmail.com",
      replyTo: auth.user.email,
      subject: `組織クレジット追加依頼: ${organization?.name ?? organizationId}`,
      html: `
        <p><strong>組織:</strong> ${organization?.name ?? organizationId}</p>
        <p><strong>依頼者:</strong> ${auth.user.email}</p>
        <p><strong>備考:</strong> ${note || "（なし）"}</p>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("requestCreditTopUp error:", error.message);
    return { error: "依頼の送信に失敗しました。しばらく経ってから再度お試しください。" };
  }
}
