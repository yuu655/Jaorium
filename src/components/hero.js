"use client";

// import Header from "@/components/header";
// import { Button } from "@/components/ui/button";
// import { ArrowDownIcon } from "lucide-react";

import { useEffect, useState } from "react";

export default function Hero() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      style={{
        height: "calc(100vh - 70px)",
        width: "100%",
        backgroundImage: "url('/default.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Noto Sans JP",
        // fontFamily: "'Noto Serif JP', 'Hiragino Mincho ProN', serif",
      }}
    >
      {/* 暗いオーバーレイ（背景画像の上に薄くかける） */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(24px, 4vw, 48px)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.9s ease, transform 0.9s ease",
        }}
      >
        {/* 縦書きメインコピー */}
        <div
          style={{
            writingMode: "vertical-rl",
            textOrientation: "upright",
            display: "flex",
            flexDirection: "column",
            gap: "clamp(12px, 2vw, 24px)",
            fontSize: "clamp(12px, 10vw, 70px)",
            lineHeight: 1.1,
            color: "#ffffff",
            textShadow: "2px 4px 16px rgba(0,0,0,0.5)",
            alignItems: "center",
            fontWeight: 700,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "20px" /* 行間 */,
              alignItems: "center",
            }}
          >
            <span
              style={{
                backgroundColor: "#ffffff",
                color: "#cc0000",
                padding: "0 clamp(12px, 1.5vw, 20px)",
                display: "inline-block",
                letterSpacing: "0.05em",
              }}
            >
              「情報戦」
            </span>
            <span>に、</span>
          </div>

          <span style={{ display: "block" }}>終止符を。</span>
        </div>

        {/* 横書きサブコピー */}
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              backgroundColor: "#ffffff",
              color: "#1a1a1a",
              padding: "clamp(6px, 1vw, 10px) clamp(12px, 2vw, 20px)",
              display: "inline-block",
              fontSize: "clamp(14px, 2vw, 24px)",
              fontWeight: 500,
              lineHeight: 1.7,
              letterSpacing: "0.04em",
              borderRadius: "10px",
              opacity: 0.8,
            }}
          >
            「知らなかった」で夢を諦める人を、
            <br />
            ゼロにする。
          </span>
        </div>
      </div>
    </section>
  );
}
