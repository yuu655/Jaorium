"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  userProfileSchema,
  mentorProfileSchema,
  firstValidationError,
} from "@/lib/validation/profileSchema";

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

// throwするとNext.jsの汎用エラー画面に落ちて理由が伝わらないため、
// エラーは文字列で返してフォーム上に表示する
function validatePassword(password, passwordCheck) {
  if (!password || password.length < 6) {
    return "パスワードは6文字以上で入力してください。";
  }
  if (password !== passwordCheck) {
    return "再入力のパスワードと一致しません。";
  }
  return null;
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
  const { error } = await supabase
    .from("profiles")
    .update({ set: true })
    .eq("id", userId);
  return { error };
}

// パスワード未入力（Googleログイン等でフォームに欄が出ないケース）はroleのみ更新。
// 「新しいパスワードが現在と同じ」エラーは、望むパスワードが既に設定済みという
// ことなので、roleだけ更新して続行する（パスワードリセット直後に同じパスワードで
// setAccountを送信して詰まるケースの救済。2026-07-15の登録失敗の一因）。
async function setPasswordAndRole(supabase, { password, role }) {
  if (password == null) {
    return supabase.auth.updateUser({ data: { role } });
  }

  const { error } = await supabase.auth.updateUser({ password, data: { role } });
  if (error?.message?.includes("different from the old password")) {
    return supabase.auth.updateUser({ data: { role } });
  }
  return { error };
}

// upsertにより、途中失敗後の再送信でも主キー重複で詰まらない
async function upsertUserRecord(supabase, record) {
  const { error } = await supabase.from("users").upsert([record]);
  return { error };
}

async function upsertMentorRecord(supabase, record) {
  const { error } = await supabase.from("mentors").upsert([record]);
  return { error };
}

async function upsertMentorTags(supabase, records) {
  if (records.length === 0) return { error: null };
  const { error } = await supabase
    .from("mentor_tags")
    .upsert(records, { ignoreDuplicates: true });
  return { error };
}

// ---- Server Actions（オーケストレーション） ----
// 各ステップは失敗したら { error } を返して打ち切る。profiles.set = true は
// 「オンボーディング完了」の印なので、他の全ステップが成功した後に最後に立てる。

async function submitUser(prevState, formData) {
  const data = parseUserFormData(formData);

  const hasPasswordInput = data.password != null || data.passwordCheck != null;
  if (hasPasswordInput) {
    const passwordError = validatePassword(data.password, data.passwordCheck);
    if (passwordError) return { error: passwordError };
  }

  const parsedProfile = userProfileSchema.safeParse(data);
  if (!parsedProfile.success) return { error: firstValidationError(parsedProfile) };

  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) redirect("/login");

  const { error: authError } = await setPasswordAndRole(supabase, {
    password: hasPasswordInput ? data.password : null,
    role: "user",
  });
  if (authError) {
    console.error("setAccount updateUser error:", authError.message);
    return {
      error: "パスワードの設定に失敗しました。別のパスワードでお試しください。",
    };
  }

  const { error: userError } = await upsertUserRecord(
    supabase,
    buildUserRecord(user.id, parsedProfile.data),
  );
  if (userError) {
    console.error("setAccount users upsert error:", userError.message);
    return { error: "登録に失敗しました。もう一度お試しください。" };
  }

  const { error: profileError } = await markProfileAsSet(supabase, user.id);
  if (profileError) {
    console.error("setAccount profiles update error:", profileError.message);
    return { error: "登録に失敗しました。もう一度お試しください。" };
  }

  redirect("/setAccount/user/icon");
}

async function submitMentor(prevState, formData) {
  const data = parseMentorFormData(formData);

  const hasPasswordInput = data.password != null || data.passwordCheck != null;
  if (hasPasswordInput) {
    const passwordError = validatePassword(data.password, data.passwordCheck);
    if (passwordError) return { error: passwordError };
  }

  const parsedProfile = mentorProfileSchema.safeParse(data);
  if (!parsedProfile.success) return { error: firstValidationError(parsedProfile) };
  const validatedData = { ...data, ...parsedProfile.data };

  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) redirect("/login");

  const { error: authError } = await setPasswordAndRole(supabase, {
    password: hasPasswordInput ? data.password : null,
    role: "mentor",
  });
  if (authError) {
    console.error("setAccount updateUser error:", authError.message);
    return {
      error: "パスワードの設定に失敗しました。別のパスワードでお試しください。",
    };
  }

  const { error: mentorError } = await upsertMentorRecord(
    supabase,
    buildMentorRecord(user.id, validatedData),
  );
  if (mentorError) {
    console.error("setAccount mentors upsert error:", mentorError.message);
    return { error: "登録に失敗しました。もう一度お試しください。" };
  }

  const { error: mentorTagsError } = await upsertMentorTags(
    supabase,
    buildMentorTagRecords(user.id, data.tagIds),
  );
  if (mentorTagsError) {
    console.error("setAccount mentor_tags upsert error:", mentorTagsError.message);
    return { error: "登録に失敗しました。もう一度お試しください。" };
  }

  const { error: profileError } = await markProfileAsSet(supabase, user.id);
  if (profileError) {
    console.error("setAccount profiles update error:", profileError.message);
    return { error: "登録に失敗しました。もう一度お試しください。" };
  }

  redirect("/setAccount/mentor/icon");
}

export { submitMentor, submitUser };
