"use server";

import { r2 } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

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

const AVATAR_CONTENT_TYPES = {
  // 画像
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf",
};

function getContentType(filename) {
  const ext = filename.split(".").pop()?.toLowerCase();
  return AVATAR_CONTENT_TYPES[ext ?? ""] ?? "application/octet-stream";
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

async function saveAvatarKey(supabase, { table, userId, key }) {
  return supabase.from(table).update({ icon: key }).eq("id", userId);
}

// ---- Server Actions（オーケストレーション） ----

export async function updateUserProfile(prevState, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await updateUserRecord(supabase, {
    userId: user.id,
    profile: parseUserProfileForm(formData),
  });

  if (!error) {
    revalidateTag(`dashboard-user-${user.id}`);
    redirect("/dashboard/user");
  }
}

export async function updateMentorProfile(prevState, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const form = parseMentorProfileForm(formData);

  const { error } = await updateMentorRecord(supabase, {
    mentorId: user.id,
    profile: {
      name: form.name,
      university: form.university,
      faculty: form.faculty,
      bio: form.bio,
      region: form.region,
      quote: form.quote,
      is_allowed: resolveIsAllowed(form.isAllowedValues),
    },
  });

  const { error: error_insert } = await replaceMentorTags(supabase, {
    mentorId: user.id,
    tagIds: form.tagIds,
  });

  if (!error && !error_insert) {
    revalidateTag(`dashboard-mentor-${user.id}`);
    revalidateTag(`mentor-tags-${user.id}`);
    redirect("/dashboard/mentor");
  }
}

export async function uploadAvatar(inputFiles) {
  const supabase = await createClient();
  if (!inputFiles) return { success: false, message: "画像を選択してください" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const role = user.user_metadata.role;
  const key = buildAvatarKey({ role, userId: user.id, filename: inputFiles.name });
  const url = await createAvatarUploadUrl({ key, contentType: getContentType(inputFiles.name) });

  const uploadRes = await uploadFileToR2(url, inputFiles);

  if (!uploadRes.ok) {
    return { success: false, message: "R2へのアップロードに失敗しました" };
  }

  const { error } = await saveAvatarKey(supabase, {
    table: resolveProfileTable(role),
    userId: user.id,
    key,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath(resolveProfileRedirectPath(role));

  return { success: true };
}
