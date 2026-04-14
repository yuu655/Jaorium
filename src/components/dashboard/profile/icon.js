"use client"

import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function Icon({ size, url }) {
  const [loaded, setLoaded] = useState(false);
  const isValidUrl = typeof url === "string" && url.length > 0;

  let avatarUrl = "/default.jpg";
  if (isValidUrl) {
    const supabase = createClient();
    avatarUrl = supabase.storage.from("avatars").getPublicUrl(url).data.publicUrl;
  }

  return (
    <div style={{ height: size, width: size }} className="relative mx-auto mb-3">
      {/* スケルトン - 画像読み込み中だけ表示 */}
      {!loaded && (
        <div
          className="absolute inset-0 rounded-full bg-gray-200 animate-pulse"
          style={{ height: size, width: size }}
        />
      )}
      <Image
        loading="lazy"
        width={size}
        height={size}
        src={avatarUrl}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          e.currentTarget.src = "/default.jpg";
          setLoaded(true);
        }}
        alt="Avatar"
        className={`rounded-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ height: size, width: size }}
      />
    </div>
  );
}