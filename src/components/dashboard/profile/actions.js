"use server";

import { r2 } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  userProfileSchema,
  mentorProfileSchema,
  firstValidationError,
} from "@/lib/validation/profileSchema";
import {
  AVATAR_MAX_SIZE_LABEL,
  AVATAR_ALLOWED_LABEL,
  getAvatarContentType,
  isAllowedAvatarFile,
  isAllowedAvatarSize,
} from "@/lib/validation/avatarLimits";

// ---- 純粋ロジック ----

function parseUserProfileForm(formData) {
  return {
    name: formData.get("name"),
    grade: formData.get("grade"),
    desire: formData.get("desire"),
  };
}

function parseMentorProfileForm(formData) {
  return {
    name: formData.get("name"),
    university: formData.get("university"),
    faculty: formData.get("faculty"),
    bio: formData.get("bio"),
    region: formData.get("region"),
    quote: formData.get("quote"),
    tagIds: formData.getAll("tagIds"),
    isAllowedValues: formData.getAll("is_allowed"),
  };
}

// 注: is_allowedが未送信の場合 getAll() は [] を返すため isAllowedValues[0] は
// undefined になり、`undefined === null` は false と判定されて true が保存される。
// チェックボックスが未チェックの意図で is_allowed=true になっている可能性があるため、
// 呼び出し元フォームの実装と合わせて要確認（挙動保存のためロジックはそのまま）。
function resolveIsAllowed(isAllowedValues) {
  return isAllowedValues[0] === null ? false : true;
}

function buildMentorTagRecords(mentorId, tagIds) {
  return tagIds.map((tagId) => ({ mentor_id: mentorId, tag_id: tagId }));
}

// パストラバーサル防止: パス区切りや".."を含む値をR2キーに使わせない
// (api/r2_upload/route.jsのisSafePathSegmentと同じ対策)
function isSafePathSegment(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !value.includes("/") &&
    !value.includes("\\") &&
    !value.includes("..")
  );
}

function buildAvatarKey({ role, userId, filename }) {
  return `${role}/${userId}/avatars/${filename}`;
}

function resolveProfileTable(role) {
  return role === "mentor" ? "mentors" : "users";
}

function resolveProfileRedirectPath(role) {
  return role === "mentor" ? "/dashboard/mentor" : "/dashboard/user";
}

// ---- I/O ----

// roleはmiddleware(proxy.js)と同じくprofilesテーブルを正とする。
// user_metadata.roleは現行のOTPサインアップフローでは設定されず、nullのままになる。
async function fetchCallerRole(supabase, userId) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role;
}

async function updateUserRecord(supabase, { userId, profile }) {
  return supabase.from("users").update(profile).eq("id", userId);
}

async function updateMentorRecord(supabase, { mentorId, profile }) {
  return supabase.from("mentors").update(profile).eq("id", mentorId);
}

async function replaceMentorTags(supabase, { mentorId, tagIds }) {
  await supabase.from("mentor_tags").delete().eq("mentor_id", mentorId);
  return supabase.from("mentor_tags").insert(buildMentorTagRecords(mentorId, tagIds));
}

async function createAvatarUploadUrl({ key, contentType }) {
  return getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 600 },
  );
}

async function uploadFileToR2(url, file) {
  return fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
}

// .select()を付けて更新された行を返させる。0行更新(対象行なし)はエラーにならないため、
// 呼び出し側で行数を確認して「成功と見せかけて何も起きていない」状態を検出する。
async function saveAvatarKey(supabase, { table, userId, key }) {
  return supabase.from(table).update({ icon: key }).eq("id", userId).select("id");
}

// ---- Server Actions（オーケストレーション） ----

export async function updateUserProfile(prevState, formData) {
  const parsed = userProfileSchema.safeParse(parseUserProfileForm(formData));
  if (!parsed.success) return { error: firstValidationError(parsed) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await updateUserRecord(supabase, {
    userId: user.id,
    profile: parsed.data,
  });

  if (error) {
    console.error("updateUserProfile error:", error.message);
    return { error: "更新に失敗しました。もう一度お試しください。" };
  }

  revalidateTag(`dashboard-user-${user.id}`);
  redirect("/dashboard/user");
}

export async function updateMentorProfile(prevState, formData) {
  const form = parseMentorProfileForm(formData);

  const parsed = mentorProfileSchema.safeParse(form);
  if (!parsed.success) return { error: firstValidationError(parsed) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await updateMentorRecord(supabase, {
    mentorId: user.id,
    profile: {
      ...parsed.data,
      is_allowed: resolveIsAllowed(form.isAllowedValues),
    },
  });

  const { error: error_insert } = await replaceMentorTags(supabase, {
    mentorId: user.id,
    tagIds: form.tagIds,
  });

  if (error || error_insert) {
    console.error("updateMentorProfile error:", (error ?? error_insert)?.message);
    return { error: "更新に失敗しました。もう一度お試しください。" };
  }

  revalidateTag(`dashboard-mentor-${user.id}`);
  revalidateTag(`mentor-tags-${user.id}`);
  redirect("/dashboard/mentor");
}

export async function uploadAvatar(inputFiles) {
  const supabase = await createClient();
  if (!inputFiles) return { success: false, message: "画像を選択してください" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "ログインしてください" };
  }

  if (!isSafePathSegment(inputFiles.name)) {
    return { success: false, message: "不正なファイル名です" };
  }

  if (!isAllowedAvatarFile(inputFiles.name)) {
    return {
      success: false,
      message: `対応していないファイル形式です（${AVATAR_ALLOWED_LABEL}のみ）`,
    };
  }

  if (!isAllowedAvatarSize(inputFiles.size)) {
    return {
      success: false,
      message: `ファイルサイズは${AVATAR_MAX_SIZE_LABEL}以内にしてください`,
    };
  }

  const role = await fetchCallerRole(supabase, user.id);
  if (role !== "user" && role !== "mentor") {
    return { success: false, message: "アカウント情報を取得できませんでした" };
  }

  const key = buildAvatarKey({ role, userId: user.id, filename: inputFiles.name });
  const url = await createAvatarUploadUrl({ key, contentType: getAvatarContentType(inputFiles.name) });

  const uploadRes = await uploadFileToR2(url, inputFiles);

  if (!uploadRes.ok) {
    return { success: false, message: "R2へのアップロードに失敗しました" };
  }

  const { data: updatedRows, error } = await saveAvatarKey(supabase, {
    table: resolveProfileTable(role),
    userId: user.id,
    key,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  if (!updatedRows || updatedRows.length === 0) {
    return { success: false, message: "プロフィールが見つかりませんでした" };
  }

  revalidatePath(resolveProfileRedirectPath(role));

  return { success: true };
}
