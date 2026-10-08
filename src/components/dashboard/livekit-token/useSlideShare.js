"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRoomContext } from "@livekit/components-react";
import { DataPacket_Kind, RoomEvent } from "livekit-client";

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
  // 共有が始まるたびに増える番号。isPresenting は既に true のまま再共有されると
  // 変化しないので、「共有が届いたらパネルを開く」はこちらを見て判定する。
  const [presentationSeq, setPresentationSeq] = useState(0);
  const chunksRef = useRef({}); // { [pageIndex]: string[] }

  const isLocalPresenter =
    isPresenting && presenterIdentity === room?.localParticipant?.identity;

  // 後から入室した参加者へ送り直すときに、イベントハンドラから最新の状態を読むためのref
  const presenterStateRef = useRef({ isLocalPresenter: false, slides: [], currentPage: 0 });
  useEffect(() => {
    presenterStateRef.current = { isLocalPresenter, slides, currentPage };
  }, [isLocalPresenter, slides, currentPage]);

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
            setPresentationSeq((n) => n + 1);
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
  // destinationIdentities を省略すると全参加者に送る
  const publish = useCallback(
    (obj, destinationIdentities) => {
      if (!room?.localParticipant) return;
      const bytes = new TextEncoder().encode(JSON.stringify(obj));
      room.localParticipant.publishData(bytes, { reliable: true, destinationIdentities });
    },
    [room]
  );

  // メタ情報→各ページ（チャンク分割）の順に送る。受信側はメタ情報でバッファを
  // リセットしてパネルを開く。
  const sendSlides = useCallback(
    async (pages, destinationIdentities) => {
      publish(
        {
          type: MSG_TYPE.SLIDE_META,
          identity: room?.localParticipant?.identity,
          totalPages: pages.length,
        },
        destinationIdentities,
      );

      for (let i = 0; i < pages.length; i++) {
        const dataUrl = pages[i].dataUrl;
        const totalChunks = Math.ceil(dataUrl.length / CHUNK_SIZE);
        for (let c = 0; c < totalChunks; c++) {
          publish(
            {
              type: MSG_TYPE.SLIDE_PAGE,
              pageIndex: i,
              chunkIndex: c,
              totalChunks,
              data: dataUrl.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE),
            },
            destinationIdentities,
          );
          // 詰まり防止のため少し待つ
          await new Promise((r) => setTimeout(r, 10));
        }
      }
    },
    [publish, room]
  );

  // ── 共有中に入室した参加者へ送り直す ──────────────────
  // データメッセージは送った時点の参加者にしか届かないので、共有を始めた後に
  // 入室（再読み込み・再接続を含む）した相手には、発表者側から今の資料とページを送る。
  useEffect(() => {
    if (!room) return;

    const onParticipantConnected = async (participant) => {
      const { isLocalPresenter: presenting, slides: pages, currentPage: page } =
        presenterStateRef.current;
      if (!presenting || !pages.length) return;

      const to = [participant.identity];
      await sendSlides(pages, to);
      if (page > 0) publish({ type: MSG_TYPE.PAGE_CHANGE, pageIndex: page }, to);
    };

    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    return () => room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
  }, [room, sendSlides, publish]);

  // ── PDFをスライド画像として読み込み ──────────────────
  // 共有するのは /api/meeting-slide で生成した面談資料PDFのみ
  const loadFile = useCallback(async (file) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      throw new Error("面談資料の形式が不正です");
    }

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
  }, []);

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
      setPresentationSeq((n) => n + 1);

      await sendSlides(pages);
    },
    [loadFile, sendSlides, room]
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
    presentationSeq,
    startPresentation,
    stopPresentation,
    goToPage,
  };
}
