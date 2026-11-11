import ExcelJS from "exceljs";

import { db } from "@/lib/db";
import type { getSession } from "@/lib/auth";

type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export const QUIZ_RESULTS_EXPORT_FORMATS = ["csv", "xlsx"] as const;
export type QuizResultsExportFormat = (typeof QUIZ_RESULTS_EXPORT_FORMATS)[number];

export type QuizResultsExportRow = {
  candidateName: string;
  className: string;
  examCode: string;
  score: number;
  passingScore: number;
  passed: boolean;
  submittedAt: Date;
  isLate: boolean;
};

export type QuizResultsExport = {
  quizTitle: string;
  className: string;
  rows: QuizResultsExportRow[];
};

type ExportFailure = {
  success: false;
  status: 401 | 403 | 404;
  error: string;
};

type ExportSuccess = {
  success: true;
  data: QuizResultsExport;
};

export type QuizResultsExportLoadResult = ExportFailure | ExportSuccess;

const columnHeaders = ["STT", "Họ và tên", "Lớp", "Mã đề", "Điểm", "Điểm đạt", "Kết quả", "Nộp lúc", "Nộp muộn"];

function resultText(row: QuizResultsExportRow): string {
  return row.passed ? "ĐẠT" : "CHƯA ĐẠT";
}

function lateText(row: QuizResultsExportRow): string {
  return row.isLate ? "Có" : "Không";
}

function formatSubmittedAt(value: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: false,
  }).format(value);
}

function safeSpreadsheetText(value: string): string {
  const trimmed = value.trimStart();
  return /^[=+\-@]/.test(trimmed) ? `'${value}` : value;
}

function csvCell(value: string | number): string {
  const text = typeof value === "string" ? safeSpreadsheetText(value) : String(value);
  return /[",\r\n]/.test(text) || /^\s|\s$/.test(text)
    ? `"${text.replaceAll('"', '""')}"`
    : text;
}

function asciiFileNamePart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "ket-qua";
}

export function buildQuizResultsExportFilename(
  quizTitle: string,
  className: string,
  format: QuizResultsExportFormat,
): string {
  return `ket-qua-${asciiFileNamePart(quizTitle)}-${asciiFileNamePart(className)}.${format}`;
}

export function isQuizResultsExportFormat(value: string | null): value is QuizResultsExportFormat {
  return value === "csv" || value === "xlsx";
}

export async function loadQuizResultsExport(
  session: Session | null,
  quizId: string,
  classId: string,
): Promise<QuizResultsExportLoadResult> {
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    return { success: false, status: 401, error: "Bạn không có quyền tải kết quả bài kiểm tra này." };
  }

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      title: true,
      passingScore: true,
      teacherId: true,
      classId: true,
      class: { select: { id: true, name: true } },
      assignments: { include: { class: { select: { id: true, name: true } } } },
    },
  });

  if (!quiz) return { success: false, status: 404, error: "Đề kiểm tra không tồn tại." };

  if (session.role === "TEACHER") {
    const teacher = await db.teacherProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!teacher || quiz.teacherId !== teacher.id) {
      return { success: false, status: 403, error: "Bạn không có quyền tải kết quả đề kiểm tra này." };
    }
  }

  const targetClass = quiz.assignments.find((assignment) => assignment.classId === classId)?.class
    ?? (quiz.assignments.length === 0 && quiz.classId === classId ? quiz.class : null);
  if (!targetClass) return { success: false, status: 404, error: "Lớp không thuộc đề kiểm tra này." };

  const submissions = await db.quizSubmission.findMany({
    where: {
      quizId,
      OR: [
        { classId },
        { classId: null, student: { classes: { some: { id: classId } } } },
      ],
    },
    include: {
      candidate: { select: { name: true } },
      student: { include: { user: { select: { name: true } } } },
      attempt: { select: { examCode: true } },
    },
    orderBy: [{ submittedAt: "desc" }, { id: "asc" }],
  });

  return {
    success: true,
    data: {
      quizTitle: quiz.title,
      className: targetClass.name,
      rows: submissions.map((submission) => ({
        candidateName: submission.candidate?.name ?? submission.student?.user.name ?? submission.guestName ?? "Thí sinh tự do",
        className: targetClass.name,
        examCode: submission.attempt?.examCode ?? "",
        score: submission.score,
        passingScore: quiz.passingScore,
        passed: submission.score >= quiz.passingScore,
        submittedAt: submission.submittedAt,
        isLate: submission.isLate,
      })),
    },
  };
}

function exportCells(row: QuizResultsExportRow, index: number): (string | number | Date)[] {
  return [
    index + 1,
    safeSpreadsheetText(row.candidateName),
    safeSpreadsheetText(row.className),
    safeSpreadsheetText(row.examCode),
    row.score,
    row.passingScore,
    resultText(row),
    row.submittedAt,
    lateText(row),
  ];
}

export function createQuizResultsCsv(data: QuizResultsExport): Uint8Array {
  const rows = [
    columnHeaders,
    ...data.rows.map((row, index) => exportCells(row, index).map((cell) => cell instanceof Date ? formatSubmittedAt(cell) : cell)),
  ];
  return new TextEncoder().encode(`﻿${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`);
}

export async function createQuizResultsXlsx(data: QuizResultsExport): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EduWeb";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet("Kết quả", { views: [{ state: "frozen", ySplit: 1 }] });

  worksheet.columns = [
    { width: 8 },
    { width: 28 },
    { width: 18 },
    { width: 14 },
    { width: 11 },
    { width: 11 },
    { width: 14 },
    { width: 21 },
    { width: 13 },
  ];
  worksheet.addRow(columnHeaders);
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
  worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  for (const [index, row] of data.rows.entries()) worksheet.addRow(exportCells(row, index));

  for (let rowIndex = 2; rowIndex <= data.rows.length + 1; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex);
    row.getCell(5).numFmt = "0.0";
    row.getCell(6).numFmt = "0.0";
    row.getCell(8).numFmt = "dd/mm/yyyy hh:mm";
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
