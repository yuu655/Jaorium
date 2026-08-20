"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight } from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PREVIEW_PAGE_LIMIT = 5;

export default function SlidePreview({ fileUrl }) {
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const goTo = (page) => {
    setCurrentPage(Math.min(Math.max(page, 1), pageCount || PREVIEW_PAGE_LIMIT));
  };

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label="前のページ"
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1}
          className="shrink-0 disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="flex-1 h-25 lg:h-30 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages }) =>
              setPageCount(Math.min(numPages, PREVIEW_PAGE_LIMIT))
            }
            loading={null}
            error={null}
          >
            <Page
              pageNumber={currentPage}
              height={116}
              loading={null}
            />
          </Document>
        </div>
        <button
          type="button"
          aria-label="次のページ"
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= (pageCount || PREVIEW_PAGE_LIMIT)}
          className="shrink-0 disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="flex justify-center gap-1.5 mt-3.5">
        {Array.from({ length: pageCount || PREVIEW_PAGE_LIMIT }, (_, i) => i + 1).map(
          (page) => (
            <button
              key={page}
              type="button"
              aria-label={`${page}ページ目を表示`}
              onClick={() => goTo(page)}
              className={`w-1.75 h-1.75 rounded-full transition-colors ${
                page === currentPage ? "bg-blue-600" : "bg-slate-300"
              }`}
            />
          ),
        )}
      </div>
    </div>
  );
}
