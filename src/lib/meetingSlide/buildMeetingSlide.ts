import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument } from "pdf-lib";
import subsetFont from "subset-font";
import { drawQuestionPage, questionPageText, type QuestionPageData } from "./questionPage";

export type BuildMeetingSlideInput = QuestionPageData & {
  mentorPdfBytes: Uint8Array | null;
};

// next.config.mjs の outputFileTracingIncludes でこのディレクトリをバンドルに含めている
const FONT_DIR = path.join(process.cwd(), "src", "assets", "fonts");

let fontCache: Promise<{ regular: Buffer; bold: Buffer }> | null = null;

function loadFontBytes() {
  fontCache ??= Promise.all([
    readFile(path.join(FONT_DIR, "NotoSansJP-Regular.ttf")),
    readFile(path.join(FONT_DIR, "NotoSansJP-Bold.ttf")),
  ])
    .then(([regular, bold]) => ({ regular, bold }))
    .catch((e) => {
      // 失敗を覚えたままにしないよう、次回呼び出しで読み直す
      fontCache = null;
      throw e;
    });
  return fontCache;
}

async function copyMentorPages(pdfDoc: PDFDocument, mentorPdfBytes: Uint8Array) {
  try {
    const mentorDoc = await PDFDocument.load(mentorPdfBytes, { ignoreEncryption: true });
    const pages = await pdfDoc.copyPages(mentorDoc, mentorDoc.getPageIndices());
    pages.forEach((page) => pdfDoc.addPage(page));
  } catch (e) {
    // 壊れたPDF等で面談資料が丸ごと出せなくなるのを避け、質問ページだけは必ず返す
    console.error("mentor slide PDF could not be loaded:", e);
  }
}

// メンターのスライドPDF（あれば）の後ろに、面談ごとの質問ページを1枚連結する
export async function buildMeetingSlide({
  mentorPdfBytes,
  ...questionData
}: BuildMeetingSlideInput): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  pdfDoc.setTitle("面談資料");

  if (mentorPdfBytes) {
    await copyMentorPages(pdfDoc, mentorPdfBytes);
  }

  // Noto Sans JP をそのまま pdf-lib に渡すと、subset: true では多くのグリフが描画されず、
  // subset: false では一部の半角数字の送り幅が壊れる（どちらも実測で確認）。
  // 先に HarfBuzz（subset-font）でこのページに出る文字だけのフォントへ縮め、
  // それを pdf-lib 側でもサブセット化して埋め込むと、字形・幅・テキスト抽出とも正しくなる。
  const fontBytes = await loadFontBytes();
  const text = questionPageText(questionData);
  const [regularSubset, boldSubset] = await Promise.all([
    subsetFont(fontBytes.regular, text, { targetFormat: "truetype" }),
    subsetFont(fontBytes.bold, text, { targetFormat: "truetype" }),
  ]);
  const [regular, bold] = await Promise.all([
    pdfDoc.embedFont(regularSubset, { subset: true }),
    pdfDoc.embedFont(boldSubset, { subset: true }),
  ]);

  drawQuestionPage(pdfDoc, questionData, { regular, bold });

  return pdfDoc.save();
}
