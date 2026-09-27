"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createMentorSlideUploadUrl } from "@/app/(userPage)/dashboard/admin/mentors/actions";

// 選んだPDFを、Server Actionで発行した署名付きURLへブラウザから直接PUTする。
// 同名ファイルは上書きされる。
export default function MentorSlideUploadButton({ mentorId, className = "" }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("PDFファイルを選択してください。");
      return;
    }

    setUploading(true);
    try {
      const result = await createMentorSlideUploadUrl(mentorId, file.name, file.size);
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      const res = await fetch(result.url, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      if (!res.ok) {
        toast.error(`アップロードに失敗しました（${res.status}）。`);
        return;
      }

      toast.success(`${file.name} をアップロードしました。`);
      router.refresh();
    } catch (err) {
      console.error("slide upload error:", err);
      toast.error("アップロードに失敗しました。");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 shrink-0 ${className}`}
      >
        {uploading ? "アップロード中..." : "PDFアップロード"}
      </button>
    </>
  );
}
