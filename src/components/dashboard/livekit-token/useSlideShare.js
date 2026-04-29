"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRoomContext } from "@livekit/components-react";
import { DataPacket_Kind } from "livekit-client";

const MSG_TYPE = {
  SLIDE_META: "SLIDE_META",   // スライド枚数・タイトル
  SLIDE_PAGE: "SLIDE_PAGE",   // ページデータ（base64）
  PAGE_CHANGE: "PAGE_CHANGE", // ページ切り替え
  SLIDE_CLEAR: "SLIDE_CLEAR", // スライド削除
};

const CHUNK_SIZE = 12_000; // 12KB/chunk（DataChannel上限対策）

export function useSlideShare() {
  const room = useRoomContext();
  const [slides, setSlides] = useState([]); // { dataUrl: string }[]
  const [currentPage, setCurrentPage] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [presenterIdentity, setPresenterIdentity] = useState(null);
  const chunksRef = useRef({}); // { [pageIndex]: string[] }

  const isLocalPresenter =
    isPresenting && presenterIdentity === room?.localParticipant?.identity;

  // ── 受信ハンドラ ──────────────────────────────────────
  useEffect(() => {
    if (!room) return;

    const onData = (payload, participant) => {
      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text);

        switch (msg.type) {
          case MSG_TYPE.SLIDE_META:
            // 新しいプレゼン開始 → バッファリセット
            chunksRef.current = {};
            setSlides([]);
            setCurrentPage(0);
            setIsPresenting(true);
            setPresenterIdentity(participant?.identity ?? msg.identity);
            break;

          case MSG_TYPE.SLIDE_PAGE: {
            // チャンク受信
            const { pageIndex, chunkIndex, totalChunks, data } = msg;
            if (!chunksRef.current[pageIndex]) {
              chunksRef.current[pageIndex] = [];
            }
            chunksRef.current[pageIndex][chunkIndex] = data;
            // 全チャンク揃ったらスライドに追加
            if (
              chunksRef.current[pageIndex].filter(Boolean).length === totalChunks
            ) {
              const dataUrl = chunksRef.current[pageIndex].join("");
              setSlides((prev) => {
                const next = [...prev];
                next[pageIndex] = { dataUrl };
                return next;
              });
            }
            break;
          }

          case MSG_TYPE.PAGE_CHANGE:
            setCurrentPage(msg.pageIndex);
            break;

          case MSG_TYPE.SLIDE_CLEAR:
            setSlides([]);
            setCurrentPage(0);
            setIsPresenting(false);
            setPresenterIdentity(null);
            break;

          default:
            break;
        }
      } catch {
        // JSONでないパケットは無視
      }
    };

    room.on("dataReceived", onData);
    return () => room.off("dataReceived", onData);
  }, [room]);

  // ── 送信ヘルパー ──────────────────────────────────────
  const publish = useCallback(
    (obj) => {
      if (!room?.localParticipant) return;
      const bytes = new TextEncoder().encode(JSON.stringify(obj));
      room.localParticipant.publishData(bytes, { reliable: true });
    },
    [room]
  );

  // ── ファイルをスライドとして読み込み ──────────────────
  const loadFile = useCallback(
    async (file) => {
      if (!file) return;

      const ext = file.name.split(".").pop().toLowerCase();

      // ── PDF ──
      if (ext === "pdf") {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({
            canvasContext: canvas.getContext("2d"),
            viewport,
          }).promise;
          pages.push({ dataUrl: canvas.toDataURL("image/jpeg", 0.85) });
        }
        return pages;
      }

      // ── 画像（PNG/JPEG/GIF/WEBP）──
      if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve([{ dataUrl: e.target.result }]);
          reader.readAsDataURL(file);
        });
      }

      throw new Error(`未対応のファイル形式: .${ext}`);
    },
    []
  );

  // ── スライドを全参加者に送信 ──────────────────────────
  const startPresentation = useCallback(
    async (file) => {
      const pages = await loadFile(file);
      if (!pages?.length) return;

      // 自分のローカル状態を先に更新
      setSlides(pages);
      setCurrentPage(0);
      setIsPresenting(true);
      setPresenterIdentity(room?.localParticipant?.identity);

      // メタ情報を送信
      publish({
        type: MSG_TYPE.SLIDE_META,
        identity: room?.localParticipant?.identity,
        totalPages: pages.length,
      });

      // 各ページをチャンク分割して送信
      for (let i = 0; i < pages.length; i++) {
        const dataUrl = pages[i].dataUrl;
        const totalChunks = Math.ceil(dataUrl.length / CHUNK_SIZE);
        for (let c = 0; c < totalChunks; c++) {
          publish({
            type: MSG_TYPE.SLIDE_PAGE,
            pageIndex: i,
            chunkIndex: c,
            totalChunks,
            data: dataUrl.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE),
          });
          // 詰まり防止のため少し待つ
          await new Promise((r) => setTimeout(r, 10));
        }
      }
    },
    [loadFile, publish, room]
  );

  // ── ページ切り替え（送信者のみ） ─────────────────────
  const goToPage = useCallback(
    (pageIndex) => {
      if (!isLocalPresenter) return;
      setCurrentPage(pageIndex);
      publish({ type: MSG_TYPE.PAGE_CHANGE, pageIndex });
    },
    [isLocalPresenter, publish]
  );

  // ── 発表終了 ─────────────────────────────────────────
  const stopPresentation = useCallback(() => {
    setSlides([]);
    setCurrentPage(0);
    setIsPresenting(false);
    setPresenterIdentity(null);
    publish({ type: MSG_TYPE.SLIDE_CLEAR });
  }, [publish]);

  return {
    slides,
    currentPage,
    isPresenting,
    isLocalPresenter,
    presenterIdentity,
    startPresentation,
    stopPresentation,
    goToPage,
  };
}
