"use client";

import dynamic from "next/dynamic";

const SlidePreview = dynamic(() => import("./SlidePreview"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-2.5">
      <div className="w-5 h-5 shrink-0" />
      <div className="flex-1 h-25 lg:h-30 bg-slate-100 rounded-lg animate-pulse" />
      <div className="w-5 h-5 shrink-0" />
    </div>
  ),
});

export default function SlidePreviewClient(props) {
  return <SlidePreview {...props} />;
}
