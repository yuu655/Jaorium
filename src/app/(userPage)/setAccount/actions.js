"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function submitUser(prevState, formData) {
  const data = {
    name: formData.get("name"),
    grade: formData.get("grade"),
  };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.auth.updateUser({ data: { role: "user" } });
  const { error: error_update } = await supabase
    .from("profiles")
    .update({
      role: "user",
    })
    .eq("id", user.id);
  if (error_update) {
    throw error_update;
  }
  const { error: error_insert } = await supabase.from("users").insert([
    {
      id: user.id,
      name: data.name,
      grade: data.grade,
    },
  ]);
  if (error_insert) {
    throw error_insert;
  }
  redirect("/setAccount/user");
  return { success: true };
}

async function submitMentor(prevState, formData) {
  const data = {
    name: formData.get("name"),
    university: formData.get("university"),
    faculty: formData.get("faculty"),
    bio: formData.get("bio"),
    region: formData.get("region"),
    quote: formData.get("quote"),
    tagIds: formData.getAll("tagIds"),
  };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.auth.updateUser({ data: { role: "mentor" } });
  const { error: error_update } = await supabase
    .from("profiles")
    .update({
      role: "mentor",
    })
    .eq("id", user.id);
  if (error_update) {
    throw error_update;
  }
  const { error: error_insert } = await supabase.from("mentors").insert([
    {
      id: user.id,
      name: data.name,
      university: data.university,
      faculty: data.faculty,
      bio: data.bio,
      region: data.region,
      quote: data.quote,
    },
  ]);
  const { error: error_insert_mentor_tags } = await supabase
    .from("mentor_tags")
    .insert(data.tagIds.map((id) => ({ mentor_id: user.id, tag_id: id })));
  if (error_insert) {
    throw error_insert;
    alert("メンター情報の保存に失敗しました");
  }
  if (error_insert_mentor_tags) {
    throw error_insert_mentor_tags;
    alert("メンター情報の保存に失敗しました2");
  }
  redirect("/setAccount/mentor");
  return { success: true };
}

export { submitMentor, submitUser };
