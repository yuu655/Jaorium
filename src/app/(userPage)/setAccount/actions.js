"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ---- フォーム解析（純粋関数） ----

function parseUserFormData(formData) {
  return {
    name: formData.get("name"),
    grade: formData.get("grade"),
    desire: formData.get("desire"),
    password: formData.get("password"),
    passwordCheck: formData.get("password_check"),
  };
}

function parseMentorFormData(formData) {
  return {
    name: formData.get("name"),
    university: formData.get("university"),
    faculty: formData.get("faculty"),
    bio: formData.get("bio"),
    region: formData.get("region"),
    quote: formData.get("quote"),
    tagIds: formData.getAll("tagIds"),
    password: formData.get("password"),
    passwordCheck: formData.get("password_check"),
  };
}

// ---- バリデーション／レコード組み立て（純粋関数） ----

function assertPasswordsMatch(password, passwordCheck) {
  if (password !== passwordCheck) {
    throw new Error("パスワードが一致しません");
  }
}

function buildUserRecord(userId, data) {
  return { id: userId, name: data.name, grade: data.grade, desire: data.desire };
}

function buildMentorRecord(userId, data) {
  return {
    id: userId,
    name: data.name,
    university: data.university,
    faculty: data.faculty,
    bio: data.bio,
    region: data.region,
    quote: data.quote,
  };
}

function buildMentorTagRecords(mentorId, tagIds) {
  return tagIds.map((tagId) => ({ mentor_id: mentorId, tag_id: tagId }));
}

// ---- I/O（Supabase呼び出し） ----

async function getCurrentUser(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function markProfileAsSet(supabase, userId) {
  const { error } = await supabase.from("profiles").update({ set: true }).eq("id", userId);
  if (error) throw error;
}

async function setUserPasswordAndRole(supabase, password) {
  await supabase.auth.updateUser({ password, data: { role: "user" } });
}

async function insertUserRecord(supabase, record) {
  const { error } = await supabase.from("users").insert([record]);
  if (error) throw error;
}

// mentors/mentor_tagsの2件は、元の実装同様どちらか一方が失敗しても両方実行されてから
// まとめてエラー判定される（早期returnなし）。そのため他のI/O関数と異なりthrowせず
// { error } をそのまま返し、呼び出し側（submitMentor）で順序どおりに判定する。
async function insertMentorRecord(supabase, record) {
  const { error } = await supabase.from("mentors").insert([record]);
  return { error };
}

async function insertMentorTags(supabase, records) {
  const { error } = await supabase.from("mentor_tags").insert(records);
  return { error };
}

// ---- Server Actions（オーケストレーション） ----

async function submitUser(prevState, formData) {
  const data = parseUserFormData(formData);
  assertPasswordsMatch(data.password, data.passwordCheck);

  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  await setUserPasswordAndRole(supabase, data.password);
  await markProfileAsSet(supabase, user.id);
  await insertUserRecord(supabase, buildUserRecord(user.id, data));

  redirect("/setAccount/user/icon");
  return { success: true };
}

async function submitMentor(prevState, formData) {
  const data = parseMentorFormData(formData);
  assertPasswordsMatch(data.password, data.passwordCheck);

  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  // await supabase.auth.updateUser({ password: data.password, data: { role: "mentor" } });

  await markProfileAsSet(supabase, user.id);

  const { error: mentorInsertError } = await insertMentorRecord(
    supabase,
    buildMentorRecord(user.id, data),
  );
  const { error: mentorTagsInsertError } = await insertMentorTags(
    supabase,
    buildMentorTagRecords(user.id, data.tagIds),
  );

  if (mentorInsertError) {
    throw mentorInsertError;
  }
  if (mentorTagsInsertError) {
    throw mentorTagsInsertError;
  }

  redirect("/setAccount/mentor/icon");
  return { success: true };
}

export { submitMentor, submitUser };
