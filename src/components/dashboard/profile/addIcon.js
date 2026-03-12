"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import AvatarUpload from "./AvatarUpload";

const supabase = createClient();

export default function AddIcon({ format, uid, onUpload, profile }) {
  const [uploading, setUploading] = useState(false);
  const [inputFilesPath, setInputFilesPath] = useState(null);
  const [prevFilesPath, setPrevFilesPath] = useState(null);
  const [inputFiles, setInputFiles] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(
    profile?.icon
      ? supabase.storage.from("avatars").getPublicUrl(profile.icon).data.publicUrl
      : null,
  );

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${format}/${uid}/${Math.random()}.${fileExt}`;
      setInputFilesPath(filePath);
      setInputFiles(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const deleteAvatar = async (path) => {
    const { error } = await supabase.storage.from("avatars").remove([path]);
    if (error) console.error("削除失敗:", error.message);
  };

  const uploadAvatar = async () => {
    try {
      setUploading(true);
      if (!inputFiles) throw new Error("画像を選択してください");

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(inputFilesPath, inputFiles, { upsert: true });

      if (uploadError) throw uploadError;

      onUpload(inputFilesPath);

      // アップロード成功後に古いファイルを削除
      if (prevFilesPath) deleteAvatar(prevFilesPath);
      setPrevFilesPath(inputFilesPath);
    } catch (error) {
      console.log(error);
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <AvatarUpload
      handleFileChange={handleFileChange}
      uploadAvatar={uploadAvatar}
      uploading={uploading}
      previewUrl={previewUrl}
      profile={profile}
    />
  );
}
