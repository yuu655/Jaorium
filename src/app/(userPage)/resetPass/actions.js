"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function resetPass(prevState, formData) {
    const supabase = await createClient();
    if (formData.get("password") !== formData.get("password_check")) {
        return {error: "再入力のパスワードと一致しません"}
    }
    
    const { error } = await supabase.auth.updateUser({
        password: formData.get("password")
    })

    if (error) {
        return { error: "ログインに失敗しました" };
    }

    revalidatePath("/", "layout");
    redirect("/setAccount"); // 成功時はリダイレクト
}
