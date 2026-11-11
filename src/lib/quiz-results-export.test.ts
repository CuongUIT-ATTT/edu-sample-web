import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import {
  buildQuizResultsExportFilename,
  createQuizResultsCsv,
  createQuizResultsXlsx,
  type QuizResultsExport,
} from "@/lib/quiz-results-export";

const sample: QuizResultsExport = {
  quizTitle: "Kiểm tra Toán 1",
  className: "10A1",
  rows: [{
    candidateName: "Nguyễn, \"An\"",
    className: "10A1",
    examCode: "=A1",
    score: 8.5,
    passingScore: 5,
    passed: true,
    submittedAt: new Date("2026-01-15T02:30:00.000Z"),
    isLate: false,
  }],
};

describe("quiz results export renderers", () => {
  it("creates a BOM-prefixed CSV with safely escaped values", () => {
    const bytes = createQuizResultsCsv(sample);
    const csv = new TextDecoder().decode(bytes);

    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(csv.startsWith("STT,Họ và tên,Lớp,Mã đề,Điểm,Điểm đạt,Kết quả,Nộp lúc,Nộp muộn\r\n")).toBe(true);
    expect(csv).toContain('"Nguyễn, ""An"""');
    expect(csv).toContain("'=A1");
    expect(csv).toContain("ĐẠT");
    expect(csv).toContain("Không");
  });

  it("creates a workbook with number and date cells", async () => {
    const bytes = await createQuizResultsXlsx(sample);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
    const worksheet = workbook.getWorksheet("Kết quả");

    expect(worksheet?.getCell("A1").value).toBe("STT");
    expect(worksheet?.getCell("E2").value).toBe(8.5);
    expect(worksheet?.getCell("H2").value).toBeInstanceOf(Date);
    expect(worksheet?.getCell("D2").value).toBe("'=A1");
  });

  it("builds a portable filename", () => {
    expect(buildQuizResultsExportFilename("Kiểm tra Toán 1", "Lớp 10A1", "xlsx"))
      .toBe("ket-qua-Kiem-tra-Toan-1-Lop-10A1.xlsx");
  });
});
