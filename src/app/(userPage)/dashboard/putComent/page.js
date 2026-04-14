"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CommentForm() {
  const [content, setContent] = useState("");
  const [user, setUser] = useState(null);
  const [comment, setComment] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []); 
  // ※ `createClient` は内部でキャッシュされるためここでの呼び出しで問題ありません

  const insertComment = async (e) => {
    e.preventDefault();

    if (!user) {
      console.error("ユーザー情報がありません。ログインしてください。");
      return; 
    }

    const { data, error } = await supabase
      .from("comments")
      .insert([
        {
          content: content,
          send_user: user.id, // userがnullのまま実行するとここでエラーになります
        },
      ])
      .select();

    await setComment(data[0].content);

    if (error) {
      console.error("エラー:", error.message);
    } else {
      console.log("成功:", data);
      setContent(""); // 送信後にフォームを空にする
    }
  };

  return (
    <>
      <form onSubmit={insertComment}>
        <label>content:</label>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border p-1"
        />
        <button type="submit" className="bg-blue-500 text-white p-1 ml-2">
          投稿する
        </button>
      </form>
      {comment}
    </>
  );
}