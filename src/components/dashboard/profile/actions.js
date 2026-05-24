"use server";

import { r2 } from "@/lib/r2";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

// async function updateUserIcon(inputFiles) {
//   const supabase = await createClient();
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();
//   const { error } = await supabase
//     .from("users")
//     .update({ icon: inputFiles })
//     .eq("id", user.id);

//   if (!error) {
//     revalidatePath("/dashboard/user");
//     redirect("/dashboard/user");
//   }
// }

export async function updateUserProfile(prevState, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("users")
    .update({
      name: formData.get("name"),
      grade: formData.get("grade"),
      desire: formData.get("desire"),
    })
    .eq("id", user.id);

  if (!error) {
    revalidateTag(`dashboard-user-${user.id}`);
    redirect("/dashboard/user");
  }
}

// async function updateMentorIcon(inputFiles) {
//   const supabase = await createClient();
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();
//   const { error } = await supabase
//     .from("mentors")
//     .update({ icon: inputFiles })
//     .eq("id", user.id);

//   if (!error) {
//     revalidatePath("/dashboard/mentor");
//     redirect("/dashboard/mentor");
//   }
// }

export async function updateMentorProfile(prevState, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const data = {
    name: formData.get("name"),
    university: formData.get("university"),
    faculty: formData.get("faculty"),
    bio: formData.get("bio"),
    region: formData.get("region"),
    quote: formData.get("quote"),
    tagIds: formData.getAll("tagIds"),
    is_allowed: formData.getAll("is_allowed"),
  };
  console.log(data.is_allowed[0]);
  const { error } = await supabase
    .from("mentors")
    .update({
      name: data.name,
      university: data.university,
      faculty: data.faculty,
      bio: data.bio,
      region: data.region,
      quote: data.quote,
      is_allowed: data.is_allowed[0] === null ? false : true,
    })
    .eq("id", user.id);

  // data.tagIds.forEach(async (tagId) => {
  //   const { error: error_tag } = await supabase
  //     .from("mentor_tags")
  //     .upsert({ mentor_id: user.id, tag_id: tagId }, { onConflict: "mentor_id,tag_id" });
  // });
  await supabase.from("mentor_tags").delete().eq("mentor_id", user.id);
  const { error: error_insert } = await supabase
    .from("mentor_tags")
    .insert(data.tagIds.map((id) => ({ mentor_id: user.id, tag_id: id })));

  console.log(error);
  if (!error && !error_insert) {
    revalidateTag(`dashboard-mentor-${user.id}`);
    revalidateTag(`mentor-tags-${user.id}`);
    redirect("/dashboard/mentor");
  }
}

export async function uploadAvatar(inputFiles) {
  const supabase = await createClient();
  if (!inputFiles) return { success: false, message: "画像を選択してください" };

  const getContentType = (filename) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    const types = {
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
    return types[ext ?? ""] ?? "application/octet-stream";
  };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const key = `${user.user_metadata.role}/${user.id}/avatars/${inputFiles.name}`;
  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      ContentType: getContentType(inputFiles.name),
    }),
    { expiresIn: 600 },
  );

  const uploadRes = await fetch(url, {
    method: "PUT",
    body: inputFiles,
    headers: { "Content-Type": inputFiles.type },
  });

  if (!uploadRes.ok) {
    return { success: false, message: "R2へのアップロードに失敗しました" };
  }

  const table = user.user_metadata.role === "mentor" ? "mentors" : "users";
  const redirectPath = user.user_metadata.role === "mentor"
    ? "/dashboard/mentor"
    : "/dashboard/user";

  const { error } = await supabase
    .from(table)
    .update({ icon: key })
    .eq("id", user.id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath(redirectPath);

  // アップロード成功後に古いファイルを削除
  // if (prevFilesPath) deleteAvatar(prevFilesPath);
  // setPrevFilesPath(inputFilesPath);

  return { success: true };
}

// export async function getAvatarUrl(key) {
//   const supabase = await createClient()

//   const { data: { user } } = await supabase.auth.getUser()
//   if (!user) return { success: false, message: "Unauthorized" }

//   // 署名付きURL生成（10分間有効）
//   const signedUrl = await getSignedUrl(
//     r2,
//     new GetObjectCommand({
//       Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
//       Key: key,  // 例: "mentor/uuid/avatars/image.png"
//     }),
//     { expiresIn: 600 }
//   )

//   if(!signedUrl)
//     return { success: false, message: "Failed to generate signed URL" }

//   return { success: true, url: signedUrl }
// }