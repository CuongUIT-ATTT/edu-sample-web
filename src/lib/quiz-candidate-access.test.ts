import { describe, expect, it } from "vitest";
import {
  decryptCandidateCode,
  digestCandidateCode,
  encryptCandidateCode,
  generateCandidateCode,
  getBindingExpiresAt,
  parseCandidateCsv,
} from "./quiz-candidate-access";

describe("quiz candidate access utilities", () => {
  it("generates a readable code that normalizes consistently", () => {
    const code = generateCandidateCode();
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(digestCandidateCode(code)).toBe(digestCandidateCode(code.replace("-", " ").toLowerCase()));
  });

  it("encrypts issued codes without storing their plaintext representation", () => {
    const code = "AB12-CD34";
    const encrypted = encryptCandidateCode(code);
    expect(encrypted).not.toContain(code);
    expect(decryptCandidateCode(encrypted)).toBe(code);
  });

  it("parses a one-column Vietnamese-name CSV", () => {
    expect(parseCandidateCsv("Họ tên\r\nNguyễn Văn A\r\nTrần Thị B\r\n")).toEqual({
      success: true,
      names: ["Nguyễn Văn A", "Trần Thị B"],
    });
    expect(parseCandidateCsv("Họ tên,Mã HS\nNguyễn Văn A,1")).toMatchObject({ success: false });
    expect(parseCandidateCsv("\nName\n  Nguyễn   Văn A  \n")).toEqual({
      success: true,
      names: ["Nguyễn Văn A"],
    });
  });

  it("calculates binding expiry by hours or deadline", () => {
    const now = new Date("2026-10-14T00:00:00.000Z");
    expect(getBindingExpiresAt({ mode: "HOURS", hours: 2, now })?.toISOString()).toBe("2026-10-14T02:00:00.000Z");
    expect(getBindingExpiresAt({ mode: "DEADLINE", deadline: new Date("2026-10-14T03:00:00.000Z"), now })?.toISOString()).toBe("2026-10-14T03:00:00.000Z");
  });
});
