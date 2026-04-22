"use client";
import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Keyboard } from "swiper/modules";
import { Button } from "./ui/button";

import "swiper/css";
import "swiper/css/navigation";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// workerの設定
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfSlider({ fileUrl, pptxUrl }) {
  const [numPages, setNumPages] = useState(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={containerRef} style={{ width: "100%" }}>
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          <Swiper
            modules={[Navigation, Keyboard]}
            navigation
            keyboard={{ enabled: true }}
            slidesPerView={1}
          >
            {numPages &&
              containerWidth > 0 &&
              Array.from({ length: numPages }, (_, i) => (
                <SwiperSlide key={i}>
                  <Page pageNumber={i + 1} width={containerWidth} />
                </SwiperSlide>
              ))}
          </Swiper>
        </Document>
      </div>
      <div className="flex flex-col items-center">
        <Button
          variant="default"
          className="mt-4"
          onClick={() => {
            const link = document.createElement("a");
            link.href = pptxUrl; // ファイルのURLやパス
            link.download = "templateSlide.pptx";
            link.click();
          }}
        >
          PPTXファイルをダウンロード
        </Button>
      </div>
    </>
  );
}
