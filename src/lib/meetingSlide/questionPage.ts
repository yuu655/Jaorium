import { rgb, type PDFDocument, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { ELLIPSIS, fitText } from "./wrapText";

// public/templateQuestion.pdf（1440×810px相当）のデザインを見本に、
// 960×540pt（同じ16:9）へ2/3倍で座標を写して描画する。
// SVGパスは左上原点・y下向きで書けるので、図形はすべて drawSvgPath で描く。

export const PAGE_WIDTH = 960;
export const PAGE_HEIGHT = 540;

export type QuestionPageData = {
  troubleEpisode: string | null;
  unresolvedIssues: string | null;
  adviceItems: string[];
};

export type QuestionPageFonts = {
  regular: PDFFont;
  bold: PDFFont;
};

function hex(value: string): RGB {
  const n = parseInt(value.replace("#", ""), 16);
  return rgb(((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255);
}

const COLORS = {
  navy: hex("#1f2d4d"),
  purple: hex("#7b1fa2"),
  red: hex("#e53935"),
  redFill: hex("#fff4f6"),
  blue: hex("#1565c0"),
  blueFill: hex("#e8eef9"),
  divider: hex("#d9d9d9"),
  note: hex("#8a8a8a"),
  body: hex("#333333"),
  placeholder: hex("#9e9e9e"),
  bubble: hex("#d8c8ee"),
  clipboard: hex("#b0876a"),
};

const PANEL = { top: 80, height: 364, width: 430, radius: 8, border: 1.5 };
const LEFT_X = 29;
const RIGHT_X = 509;
const EMPTY_ANSWER = "（回答なし）";
const EMPTY_ADVICE = "（未入力）";

const LABELS = {
  title: "いただいた現在のお悩みについて",
  surveyHeading: "アンケートで教えてくれたこと",
  q5: "Q. 最近一番困ったエピソード",
  q7: "Q. 行動しても解決しなかったこと",
  adviceHeading: "メンターからのアドバイス",
  adviceNote: "※ 詳細は口頭でお話しします！",
};

// フォントのサブセット化用に、このページに描かれうる文字列をすべて返す
export function questionPageText(data: QuestionPageData): string {
  return [
    ...Object.values(LABELS),
    EMPTY_ANSWER,
    EMPTY_ADVICE,
    ELLIPSIS,
    data.troubleEpisode ?? "",
    data.unresolvedIssues ?? "",
    ...data.adviceItems,
  ].join("");
}

function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  return [
    `M ${x + r} ${y}`,
    `H ${x + w - r}`,
    `Q ${x + w} ${y} ${x + w} ${y + r}`,
    `V ${y + h - r}`,
    `Q ${x + w} ${y + h} ${x + w - r} ${y + h}`,
    `H ${x + r}`,
    `Q ${x} ${y + h} ${x} ${y + h - r}`,
    `V ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    "Z",
  ].join(" ");
}

// 左上原点の図形描画
function drawPath(
  page: PDFPage,
  path: string,
  options: { fill?: RGB; stroke?: RGB; strokeWidth?: number },
) {
  page.drawSvgPath(path, {
    x: 0,
    y: PAGE_HEIGHT,
    color: options.fill,
    borderColor: options.stroke,
    borderWidth: options.stroke ? (options.strokeWidth ?? 1) : 0,
  });
}

// top は文字の上端（左上原点）。drawText はベースライン指定なのでここで換算する
function drawTextAt(
  page: PDFPage,
  text: string,
  { x, top, size, font, color }: { x: number; top: number; size: number; font: PDFFont; color: RGB },
) {
  page.drawText(text, { x, y: PAGE_HEIGHT - top - size * 0.88, size, font, color });
}

function drawTextBlock(
  page: PDFPage,
  text: string,
  box: { x: number; top: number; width: number; height: number },
  font: PDFFont,
  { maxSize, minSize, color }: { maxSize: number; minSize: number; color: RGB },
) {
  const fitted = fitText(text, font, {
    maxWidth: box.width,
    maxHeight: box.height,
    maxSize,
    minSize,
  });
  fitted.lines.forEach((line, i) => {
    drawTextAt(page, line, {
      x: box.x,
      top: box.top + i * fitted.lineHeight,
      size: fitted.size,
      font,
      color,
    });
  });
}

function drawPanel(page: PDFPage, x: number, stroke: RGB, fill: RGB) {
  drawPath(page, roundedRectPath(x, PANEL.top, PANEL.width, PANEL.height, PANEL.radius), {
    fill,
    stroke,
    strokeWidth: PANEL.border,
  });
}

function drawDivider(page: PDFPage, x: number) {
  drawPath(page, `M ${x} 121 H ${x + 386}`, { stroke: COLORS.divider, strokeWidth: 1.5 });
}

// 絵文字（📋💬）はフォントにないため簡単な図形で置き換える
function drawClipboardIcon(page: PDFPage, x: number, top: number) {
  drawPath(page, roundedRectPath(x, top + 2, 11, 14, 1.5), { fill: COLORS.clipboard });
  drawPath(page, roundedRectPath(x + 2, top + 5, 7, 9, 0.5), { fill: hex("#ffffff") });
  drawPath(page, roundedRectPath(x + 3, top, 5, 4, 1), { fill: hex("#9e9e9e") });
}

function drawBubbleIcon(page: PDFPage, x: number, top: number) {
  drawPath(
    page,
    `M ${x + 7} ${top + 2} C ${x + 14} ${top + 2} ${x + 15} ${top + 12} ${x + 7} ${top + 12} ` +
      `L ${x + 3} ${top + 15} L ${x + 4} ${top + 11} C ${x - 1} ${top + 9} ${x} ${top + 2} ${x + 7} ${top + 2} Z`,
    { fill: COLORS.bubble },
  );
}

function orPlaceholder(value: string | null | undefined, placeholder: string): string {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? placeholder : trimmed;
}

export function drawQuestionPage(
  pdfDoc: PDFDocument,
  data: QuestionPageData,
  { regular, bold }: QuestionPageFonts,
  index: number,
): PDFPage {
  const page = pdfDoc.insertPage(index, [PAGE_WIDTH, PAGE_HEIGHT]);

  // ── タイトル ──
  drawPath(page, `M 25 29 H 30 V 60 H 25 Z`, { fill: COLORS.purple });
  drawTextAt(page, LABELS.title, {
    x: 48,
    top: 30,
    size: 27,
    font: bold,
    color: COLORS.navy,
  });

  // ── 左パネル：アンケート回答 ──
  drawPanel(page, LEFT_X, COLORS.red, COLORS.redFill);
  drawClipboardIcon(page, 58, 92);
  drawTextAt(page, LABELS.surveyHeading, {
    x: 78,
    top: 92,
    size: 15,
    font: bold,
    color: COLORS.red,
  });
  drawDivider(page, 47);

  const answerX = 55;
  const answerWidth = 380;

  drawTextAt(page, LABELS.q5, {
    x: answerX,
    top: 136,
    size: 12,
    font: bold,
    color: COLORS.navy,
  });
  const troubleEpisode = orPlaceholder(data.troubleEpisode, EMPTY_ANSWER);
  drawTextBlock(
    page,
    troubleEpisode,
    { x: answerX + 4, top: 158, width: answerWidth - 4, height: 84 },
    regular,
    { maxSize: 12, minSize: 7, color: data.troubleEpisode?.trim() ? COLORS.body : COLORS.placeholder },
  );

  drawTextAt(page, LABELS.q7, {
    x: answerX,
    top: 248,
    size: 12,
    font: bold,
    color: COLORS.navy,
  });
  const unresolvedIssues = orPlaceholder(data.unresolvedIssues, EMPTY_ANSWER);
  drawTextBlock(
    page,
    unresolvedIssues,
    { x: answerX + 4, top: 270, width: answerWidth - 4, height: 160 },
    regular,
    {
      maxSize: 12,
      minSize: 7,
      color: data.unresolvedIssues?.trim() ? COLORS.body : COLORS.placeholder,
    },
  );

  // ── 右パネル：メンターからのアドバイス ──
  drawPanel(page, RIGHT_X, COLORS.blue, COLORS.blueFill);
  drawBubbleIcon(page, 534, 93);
  drawTextAt(page, LABELS.adviceHeading, {
    x: 555,
    top: 92,
    size: 15,
    font: bold,
    color: COLORS.blue,
  });
  drawDivider(page, 524);
  drawTextAt(page, LABELS.adviceNote, {
    x: 531,
    top: 131,
    size: 11,
    font: regular,
    color: COLORS.note,
  });

  const adviceTops = [160, 240, 320];
  adviceTops.forEach((top, i) => {
    drawPath(page, `M 520 ${top} H 537 V ${top + 17} H 520 Z`, { fill: COLORS.blue });
    const item = data.adviceItems[i]?.trim() ?? "";
    // 保存時に空欄は詰めるので、1件目が空＝アドバイスが1件もない。
    // そのときだけ「（未入力）」を出し、2件目以降の空欄は■のみにする
    if (item === "" && i > 0) return;
    drawTextBlock(
      page,
      item === "" ? EMPTY_ADVICE : item,
      { x: 546, top: top + 1, width: 380, height: 70 },
      item === "" ? regular : bold,
      { maxSize: 13, minSize: 8, color: item === "" ? COLORS.placeholder : COLORS.navy },
    );
  });

  return page;
}
