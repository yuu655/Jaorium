"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import getUrls from "@/utils/getUrls";

// ---- 純粋ロジック ----

function generateJoinCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

function isUniqueViolation(error) {
  return error?.code === "23505";
}

// ---- I/O（Supabase呼び出し） ----

// isNewInvite=true（まだパスワード未設定）ならset=false、既存ユーザー（既にログイン可能）
// ならset=trueにする。setAccount/actions.jsのmarkProfileAsSetと同じ「オンボーディング
// 完了フラグ」の考え方を、招待済み/既存ユーザーどちらの経路でも一貫させたもの。
async function setOwnerProfileState(masterSupabase, { userId, isNewInvite }) {
  return masterSupabase
    .from("profiles")
    .update({ role: "organization", set: !isNewInvite })
    .eq("id", userId);
}

async function getCurrentUser(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function isCallerAdmin(supabase, userId) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return !error && profile?.role === "admin";
}

async function requireAdmin() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { error: "ログインが必要です。" };
  if (!(await isCallerAdmin(supabase, user.id))) {
    return { error: "権限がありません。" };
  }
  return { user };
}

// ---- Server Actions（オーケストレーション） ----

export async function createOrganization(name) {
  const auth = await requireAdmin();
  if (auth.error) return auth;

  const trimmedName = (name ?? "").trim();
  if (!trimmedName) return { error: "組織名を入力してください。" };

  const masterSupabase = createAdminSupabaseClient();

  // join_codeはUNIQUE制約があるため、衝突時は数回リトライする
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateJoinCode();
    const { error } = await masterSupabase.from("organizations").insert({
      name: trimmedName,
      join_code: code,
      created_by: auth.user.id,
    });

    if (!error) {
      revalidatePath("/dashboard/admin/organizations");
      return { success: true };
    }
    if (!isUniqueViolation(error)) {
      console.error("createOrganization error:", error.message);
      return { error: "組織の作成に失敗しました。" };
    }
  }

  return { error: "組織コードの発行に失敗しました。もう一度お試しください。" };
}

// 既存ユーザーのメールならそのユーザーをownerに割り当て、未登録のメールなら
// Supabaseの招待メール経由で新規アカウントを作成してからownerに割り当てる
export async function assignOwner(organizationId, email) {
  const auth = await requireAdmin();
  if (auth.error) return auth;

  const trimmedEmail = (email ?? "").trim();
  if (!trimmedEmail) return { error: "メールアドレスを入力してください。" };

  const masterSupabase = createAdminSupabaseClient();

  const { data: existingUserId, error: lookupError } = await masterSupabase.rpc(
    "find_user_id_by_email",
    { check_email: trimmedEmail },
  );

  if (lookupError) {
    console.error("assignOwner lookup error:", lookupError.message);
    return { error: "ユーザーの検索に失敗しました。" };
  }

  let ownerUserId = existingUserId;
  const isNewInvite = !ownerUserId;

  if (isNewInvite) {
    // 招待メールのリンク先は専用のパスワード設定ページへ（通常ログインのpassword欄には誘導しない）
    const { data, error } = await masterSupabase.auth.admin.inviteUserByEmail(trimmedEmail, {
      redirectTo: `${getUrls()}/api/auth/confirm?next=/dashboard/organization/setPassword`,
    });
    if (error) {
      console.error("assignOwner inviteUserByEmail error:", error.message);
      return { error: "招待メールの送信に失敗しました。" };
    }
    ownerUserId = data.user.id;
  }

  const { error: insertError } = await masterSupabase
    .from("organization_owners")
    .insert({ organization_id: organizationId, user_id: ownerUserId });

  const alreadyOwner = insertError && isUniqueViolation(insertError);
  if (insertError && !alreadyOwner) {
    console.error("assignOwner insert error:", insertError.message);
    return { error: "owner登録に失敗しました。" };
  }

  // 既にowner登録済みの再実行でもrole/setを再同期できるよう、常に実行する
  const { error: profileError } = await setOwnerProfileState(masterSupabase, {
    userId: ownerUserId,
    isNewInvite,
  });

  if (profileError) {
    console.error("assignOwner profiles update error:", profileError.message);
    return { error: "アカウント状態の更新に失敗しました。" };
  }

  revalidatePath("/dashboard/admin/organizations");

  if (alreadyOwner) {
    return { error: "このユーザーは既にownerとして登録されています。" };
  }
  return { success: true };
}

export async function removeOwner(organizationId, userId) {
  const auth = await requireAdmin();
  if (auth.error) return auth;

  const masterSupabase = createAdminSupabaseClient();
  const { error } = await masterSupabase
    .from("organization_owners")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", userId);

  if (error) {
    console.error("removeOwner error:", error.message);
    return { error: "ownerの削除に失敗しました。" };
  }

  // 他に所有している組織が残っていなければ、role="organization"のまま
  // /dashboard/organizationへ誘導され続けてしまう（ページ側は「owner権限なし」で
  // /dashboardへ戻すため、ミドルウェアとの間で無限リダイレクトになる）。
  // 未設定状態に戻し、必要なら改めてassignOwnerで再割り当てする。
  const { data: remainingOwnerships } = await masterSupabase
    .from("organization_owners")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1);

  if (!remainingOwnerships || remainingOwnerships.length === 0) {
    const { error: profileError } = await masterSupabase
      .from("profiles")
      .update({ role: "pending", set: false })
      .eq("id", userId);
    if (profileError) {
      console.error("removeOwner profiles reset error:", profileError.message);
    }
  }

  revalidatePath("/dashboard/admin/organizations");
  return { success: true };
}

// 論理削除: organizations.statusを'archived'にして一覧から隠す。
// organization_credit_logs等の履歴はDBに残したまま（財務記録を失わないため）、
// 実データを持つ組織でも取り消し可能な形で削除できるようにする。
export async function deleteOrganization(organizationId) {
  const auth = await requireAdmin();
  if (auth.error) return auth;

  const masterSupabase = createAdminSupabaseClient();
  const { error } = await masterSupabase
    .from("organizations")
    .update({ status: "archived" })
    .eq("id", organizationId);

  if (error) {
    console.error("deleteOrganization error:", error.message);
    return { error: "組織の削除に失敗しました。" };
  }

  revalidatePath("/dashboard/admin/organizations");
  return { success: true };
}

export async function grantOrganizationCredits(organizationId, amount, note) {
  const auth = await requireAdmin();
  if (auth.error) return auth;

  const parsedAmount = Number(amount);
  if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
    return { error: "付与数は1以上の整数で入力してください。" };
  }

  const masterSupabase = createAdminSupabaseClient();
  const { error } = await masterSupabase.from("organization_credit_logs").insert({
    organization_id: organizationId,
    change: parsedAmount,
    reason: "manual_grant",
    granted_by: auth.user.id,
  });

  if (error) {
    console.error("grantOrganizationCredits error:", error.message);
    return { error: "クレジットの付与に失敗しました。" };
  }

  revalidatePath("/dashboard/admin/organizations");
  return { success: true };
}
