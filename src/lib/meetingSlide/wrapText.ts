// pdf-lib の PDFFont のうち、幅の計測に使うメソッドだけに依存する（テストで差し替えやすくするため）
export type MeasurableFont = {
  widthOfTextAtSize(text: string, size: number): number;
};

export type FitOptions = {
  maxWidth: number;
  maxHeight: number;
  maxSize: number;
  minSize: number;
  lineHeightRatio?: number;
  step?: number;
};

export type FittedText = {
  size: number;
  lineHeight: number;
  lines: string[];
};

export const ELLIPSIS = "…";
const DEFAULT_LINE_HEIGHT_RATIO = 1.45;
const DEFAULT_STEP = 0.5;

// 日本語は単語区切りの空白がないため、1文字ずつ積んで幅を超えたら改行する。
// 入力中の改行はそのまま段落の区切りとして扱う。
export function wrapText(
  text: string,
  font: MeasurableFont,
  size: number,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  const paragraphs = text.replace(/\r\n?/g, "\n").split("\n");

  for (const paragraph of paragraphs) {
    let line = "";
    // サロゲートペアを分断しないよう、コードポイント単位で走査する
    for (const char of Array.from(paragraph)) {
      const candidate = line + char;
      if (line !== "" && font.widthOfTextAtSize(candidate, size) > maxWidth) {
        lines.push(line);
        line = char;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }

  return lines;
}

function maxLinesFor(maxHeight: number, lineHeight: number): number {
  return Math.max(1, Math.floor(maxHeight / lineHeight));
}

// 最終行の末尾を「…」が収まるまで削る
function withEllipsis(line: string, font: MeasurableFont, size: number, maxWidth: number): string {
  const chars = Array.from(line);
  while (chars.length > 0 && font.widthOfTextAtSize(chars.join("") + ELLIPSIS, size) > maxWidth) {
    chars.pop();
  }
  return chars.join("") + ELLIPSIS;
}

// 枠（maxWidth × maxHeight）に収まるまでフォントサイズを下げる。
// minSize でも収まらなければ、入る行数で打ち切って末尾を「…」にする。
export function fitText(text: string, font: MeasurableFont, options: FitOptions): FittedText {
  const {
    maxWidth,
    maxHeight,
    maxSize,
    minSize,
    lineHeightRatio = DEFAULT_LINE_HEIGHT_RATIO,
    step = DEFAULT_STEP,
  } = options;

  for (let size = maxSize; size >= minSize; size -= step) {
    const lineHeight = size * lineHeightRatio;
    const lines = wrapText(text, font, size, maxWidth);
    if (lines.length <= maxLinesFor(maxHeight, lineHeight)) {
      return { size, lineHeight, lines };
    }
  }

  const lineHeight = minSize * lineHeightRatio;
  const maxLines = maxLinesFor(maxHeight, lineHeight);
  const lines = wrapText(text, font, minSize, maxWidth).slice(0, maxLines);
  lines[maxLines - 1] = withEllipsis(lines[maxLines - 1] ?? "", font, minSize, maxWidth);
  return { size: minSize, lineHeight, lines };
}
