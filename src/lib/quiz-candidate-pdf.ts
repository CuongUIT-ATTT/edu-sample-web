import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export type CandidatePdfRow = {
  name: string;
  code: string;
  effectiveMaxSubmissions: number;
};

type CandidatePdfInput = {
  quizTitle: string;
  className: string;
  maxSubmissions: number;
  candidates: CandidatePdfRow[];
  regularFont: Uint8Array;
  boldFont: Uint8Array;
};

const PAGE = { width: 595.28, height: 841.89, margin: 42 };

function wrapText(font: PDFFont, value: string, size: number, maxWidth: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const rows: string[] = [];
  let row = "";
  for (const word of words) {
    const next = row ? `${row} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth || !row) row = next;
    else {
      rows.push(row);
      row = word;
    }
  }
  if (row) rows.push(row);
  return rows;
}

export async function createQuizCandidatePdf(input: CandidatePdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(input.regularFont, { subset: true });
  const bold = await pdf.embedFont(input.boldFont, { subset: true });
  const rowsPerPage = 29;
  const pageCount = Math.max(1, Math.ceil(input.candidates.length / rowsPerPage));

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const page = pdf.addPage([PAGE.width, PAGE.height]);
    const start = pageIndex * rowsPerPage;
    const rows = input.candidates.slice(start, start + rowsPerPage);
    const contentWidth = PAGE.width - PAGE.margin * 2;
    let y = PAGE.height - PAGE.margin;

    page.drawText("DANH SÁCH MÃ DỰ THI", { x: PAGE.margin, y, size: 18, font: bold, color: rgb(0.05, 0.12, 0.24) });
    y -= 24;
    for (const line of wrapText(regular, `Đề: ${input.quizTitle}`, 10, contentWidth)) {
      page.drawText(line, { x: PAGE.margin, y, size: 10, font: regular, color: rgb(0.16, 0.23, 0.34) });
      y -= 13;
    }
    page.drawText(`Lớp: ${input.className}`, { x: PAGE.margin, y, size: 10, font: bold, color: rgb(0.16, 0.23, 0.34) });
    y -= 17;
    page.drawText(`Giới hạn mặc định: ${input.maxSubmissions} lượt nộp. Chỉ phát cho đúng học sinh; không chia sẻ mã.`, { x: PAGE.margin, y, size: 8.5, font: regular, color: rgb(0.35, 0.16, 0.04) });
    y -= 19;

    const col = { no: PAGE.margin, name: PAGE.margin + 38, code: PAGE.margin + 310, limit: PAGE.margin + 425 };
    const headerBottom = y - 22;
    page.drawRectangle({ x: PAGE.margin, y: headerBottom, width: contentWidth, height: 22, color: rgb(0.91, 0.94, 0.98) });
    page.drawText("STT", { x: col.no + 7, y: y - 14, size: 8.5, font: bold });
    page.drawText("Họ và tên", { x: col.name, y: y - 14, size: 8.5, font: bold });
    page.drawText("Mã dự thi", { x: col.code, y: y - 14, size: 8.5, font: bold });
    page.drawText("Lượt", { x: col.limit, y: y - 14, size: 8.5, font: bold });
    y = headerBottom;

    for (const [index, candidate] of rows.entries()) {
      const bottom = y - 23;
      page.drawRectangle({ x: PAGE.margin, y: bottom, width: contentWidth, height: 23, borderWidth: 0.5, borderColor: rgb(0.72, 0.77, 0.84) });
      page.drawText(String(start + index + 1), { x: col.no + 9, y: bottom + 7, size: 8.5, font: regular });
      page.drawText(candidate.name, { x: col.name, y: bottom + 7, size: 8.5, font: regular, maxWidth: 245 });
      page.drawText(candidate.code, { x: col.code, y: bottom + 7, size: 10, font: bold, color: rgb(0.02, 0.25, 0.56) });
      page.drawText(String(candidate.effectiveMaxSubmissions), { x: col.limit + 7, y: bottom + 7, size: 8.5, font: bold });
      y = bottom;
    }

    page.drawText(`Trang ${pageIndex + 1}/${pageCount} • Xuất lúc ${new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date())}`, {
      x: PAGE.margin,
      y: 24,
      size: 7.5,
      font: regular,
      color: rgb(0.38, 0.43, 0.5),
    });
  }

  return pdf.save();
}
