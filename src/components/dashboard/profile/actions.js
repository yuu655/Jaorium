"use server"; // ← ファイルの先頭に必ずこれを書く

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

async function updateUserIcon(inputFiles) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("users")
    .update({ icon: inputFiles })
    .eq("id", user.id);

  if (!error) {
    revalidatePath("/dashboard/user"); // これで画面が更新される
    redirect("/dashboard/user");
  }
}

async function updateUserProfile(prevState, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("users")
    .update({ name: formData.get("name"), grade: formData.get("grade"), desire: formData.get("desire") })
    .eq("id", user.id);

  if (!error) {
    revalidateTag(`dashboard-user-${user.id}`);
    redirect("/dashboard/user");
  }
}

async function updateMentorIcon(inputFiles) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("mentors")
    .update({ icon: inputFiles })
    .eq("id", user.id);

  if (!error) {
    revalidatePath("/dashboard/mentor"); // これで画面が更新される
    redirect("/dashboard/mentor");
  }
}

async function updateMentorProfile(prevState, formData) {
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
  };
  console.log(data.tagIds);
  const { error } = await supabase
    .from("mentors")
    .update({
      name: data.name,
      university: data.university,
      faculty: data.faculty,
      bio: data.bio,
      region: data.region,
      quote: data.quote,
    })
    .eq("id", user.id);
  
  // data.tagIds.forEach(async (tagId) => {
  //   const { error: error_tag } = await supabase
  //     .from("mentor_tags")
  //     .upsert({ mentor_id: user.id, tag_id: tagId }, { onConflict: "mentor_id,tag_id" });
  // });
  await supabase
    .from("mentor_tags")
    .delete()
    .eq("mentor_id", user.id);
  const { error: error_insert } = await supabase
    .from("mentor_tags")
    .insert(data.tagIds.map((id) => ({ mentor_id: user.id, tag_id: id })));
  if (!error && !error_insert) {
    revalidateTag(`dashboard-mentor-${user.id}`);
    revalidateTag(`mentor-tags-${user.id}`);
    redirect("/dashboard/mentor");
  }
}

// async function submitMentor(prevState, formData, setIsIcon) {
//   const data = {
//     name: formData.get("name"),
//     university: formData.get("university"),
//     faculty: formData.get("faculty"),
//     bio: formData.get("bio"),
//     region: formData.get("region"),
//     quote: formData.get("quote"),
//     tagIds: formData.getAll("tagIds"),
//   };
//   const supabase = await createClient();
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();
//   await supabase.auth.updateUser({ data: { role: "mentor" } });
//   const { error: error_update } = await supabase
//     .from("profiles")
//     .update({
//       role: "mentor",
//     })
//     .eq("id", user.id);
//   if (error_update) {
//     throw error_update;
//   }
//   const { error: error_insert } = await supabase.from("mentors").insert([
//     {
//       id: user.id,
//       name: data.name,
//       university: data.university,
//       faculty: data.faculty,
//       bio: data.bio,
//       region: data.region,
//       quote: data.quote,
//     },
//   ]);
//   if (error_insert) {
//     throw error_insert;
//   }
//   setIsIcon(true);
// }

// async function submitUser(prevState, formData) {
//   const data = {
//     name: formData.get("name"),
//     grade: formData.get("grade"),
//   };
//   const supabase = await createClient();
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();
//   await supabase.auth.updateUser({ data: { role: "user" } });
//   const { error: error_update } = await supabase
//     .from("profiles")
//     .update({
//       role: "user",
//     })
//     .eq("id", user.id);
//   if (error_update) {
//     throw error_update;
//   }
//   const { error: error_insert } = await supabase.from("users").insert([
//     {
//       id: user.id,
//       name: data.name,
//       grade: data.grade,
//     },
//   ]);
//   if (error_insert) {
//     throw error_insert;
//   }
//   redirect("/dashboard/user");
// }

// async function submitMentor(prevState, formData) {
//   const data = {
//     name: formData.get("name"),
//     university: formData.get("university"),
//     faculty: formData.get("faculty"),
//     description: formData.get("description"),
//     region: formData.get("region"),
//   };
//   const supabase = await createClient();
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();
//   await supabase.auth.updateUser({ data: { role: "mentor" } });
//   const { error: error_update } = await supabase
//     .from("profiles")
//     .update({
//       role: "mentor",
//     })
//     .eq("id", user.id);
//   if (error_update) {
//     throw error_update;
//   }
//   const { error: error_insert } = await supabase.from("mentors").insert([
//     {
//       id: user.id,
//       name: data.name,
//       university: data.university,
//       faculty: data.faculty,
//       description: data.description,
//       region: data.region,
//     },
//   ]);
//   if (error_insert) {
//     throw error_insert;
//   }
//   redirect("/dashboard/mentor");
// }

export {
  updateUserIcon,
  updateMentorIcon,
  updateUserProfile,
  updateMentorProfile,
};
