"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function resetPassword(prevState, formData) {
    const supabase = await createClient();

    // メール/パスワードユーザーのみリセットメール送信
    const { error } = await supabase.auth.resetPasswordForEmail({
        email: formData.get("email"),
        options: {
            redirectTo: `https://jaorium.com/api/auth/resetpass`,
        }
    })

    // const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
        if (error.message.includes('rate limit') || error.status === 429) {
            // ユーザーに待つよう伝える
            return { error: 'しばらく時間をおいてから再度お試しください' };
        } else {
            return { error: 'メールの送信に失敗しました' };
        }
    }

    return { success: true };
}
