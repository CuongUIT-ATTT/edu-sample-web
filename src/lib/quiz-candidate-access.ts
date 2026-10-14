import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

export const QUIZ_CANDIDATE_COOKIE_PREFIX = "quiz_candidate_";
export const MAX_QUIZ_CANDIDATES = 1_000;

export type CandidateBindingExpiryMode = "HOURS" | "DEADLINE";

export type CandidateListParseResult =
  | { success: true; names: string[] }
  | { success: false; error: string };

function getEncryptionKey(): Buffer {
  const configured = process.env.QUIZ_CANDIDATE_ENCRYPTION_KEY;
  if (configured) {
    const key = Buffer.from(configured, "base64");
    if (key.length === 32) return key;
    throw new Error("QUIZ_CANDIDATE_ENCRYPTION_KEY phải là khóa base64 32 byte.");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Thiếu QUIZ_CANDIDATE_ENCRYPTION_KEY cho mã dự thi.");
  }

  // Only for local development/tests. Production always requires an explicit key.
  return createHash("sha256").update("edu-web-local-quiz-candidate-key").digest();
}

export function normalizeCandidateCode(value: string): string {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/[\s-]+/g, "") : "";
}

export function digestCandidateSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function digestCandidateCode(value: string): string {
  return digestCandidateSecret(normalizeCandidateCode(value));
}

export function generateCandidateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let value = "";
  for (let index = 0; index < 8; index += 1) {
    value += alphabet[bytes[index] % alphabet.length];
  }
  return `${value.slice(0, 4)}-${value.slice(4)}`;
}

export function generateBrowserBindingSecret(): string {
  return randomBytes(32).toString("base64url");
}

export function encryptCandidateCode(code: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(code, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((value) => value.toString("base64url")).join(".");
}

export function decryptCandidateCode(payload: string): string {
  const pieces = payload.split(".");
  if (pieces.length !== 3) throw new Error("Dữ liệu mã dự thi không hợp lệ.");

  const [ivRaw, tagRaw, encryptedRaw] = pieces;
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function getCandidateCookieName(quizId: string): string {
  return `${QUIZ_CANDIDATE_COOKIE_PREFIX}${quizId}`;
}

export function getBindingExpiresAt(input: {
  mode: CandidateBindingExpiryMode;
  hours?: number | null;
  deadline?: Date | null;
  now?: Date;
}): Date | null {
  const now = input.now ?? new Date();
  if (input.mode === "DEADLINE") {
    return input.deadline && input.deadline > now ? input.deadline : null;
  }

  const hours = input.hours ?? 0;
  if (!Number.isInteger(hours) || hours < 1) return null;
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

export function isBindingActive(expiresAt: Date | null | undefined, now = new Date()): boolean {
  return Boolean(expiresAt && expiresAt > now);
}

export function parseCandidateNames(rawNames: string[]): CandidateListParseResult {
  if (!Array.isArray(rawNames) || rawNames.some((name) => typeof name !== "string")) {
    return { success: false, error: "Danh sách thí sinh không hợp lệ." };
  }
  const names = rawNames.map((name) => name.trim().replace(/\s+/g, " ")).filter(Boolean);
  if (names.some((name) => name.length > 200)) {
    return { success: false, error: "Mỗi họ tên chỉ được tối đa 200 ký tự." };
  }
  if (names.length > MAX_QUIZ_CANDIDATES) {
    return { success: false, error: `Danh sách chỉ được tối đa ${MAX_QUIZ_CANDIDATES} thí sinh.` };
  }
  return { success: true, names };
}

export function parseCandidateCsv(csv: string): CandidateListParseResult {
  const rows = csv.replace(/^﻿/, "").split(/\r?\n/);
  const names: string[] = [];
  let isFirstNonEmptyRow = true;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index].trim();
    if (!row) continue;
    if (isFirstNonEmptyRow && /^(họ\s*tên|ho\s*ten|name)$/i.test(row.replace(/^"|"$/g, ""))) {
      isFirstNonEmptyRow = false;
      continue;
    }
    isFirstNonEmptyRow = false;
    if (row.includes(",")) {
      return { success: false, error: `Dòng ${index + 1} chỉ được chứa một cột Họ tên.` };
    }
    names.push(row.replace(/^"|"$/g, ""));
  }

  return parseCandidateNames(names);
}
