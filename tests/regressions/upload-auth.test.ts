import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { POST as uploadDocument } from "@/app/api/upload-document/route";
import { POST as uploadImage } from "@/app/api/upload-image/route";
import { POST as uploadImages } from "@/app/api/upload-images/route";
import { POST as uploadToImgbb } from "@/app/api/upload-to-imgbb/route";
import { validImage, decodeImage } from "@/lib/upload-validation";

describe("P0 - Anonymous & Wrong-Role Upload Routes Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makePostRequest(url: string, body: any = {}) {
    return new NextRequest(new URL(url, "http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  describe("Tất cả 4 Upload Routes từ chối 401 khi không đăng nhập", () => {
    it("upload-document từ chối 401 khi không có session", async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      const res = await uploadDocument(makePostRequest("/api/upload-document"));
      expect(res.status).toBe(401);
    });

    it("upload-image từ chối 401 khi không có session", async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      const res = await uploadImage(makePostRequest("/api/upload-image"));
      expect(res.status).toBe(401);
    });

    it("upload-images từ chối 401 khi không có session", async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      const res = await uploadImages(makePostRequest("/api/upload-images"));
      expect(res.status).toBe(401);
    });

    it("upload-to-imgbb từ chối 401 khi không có session", async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      const res = await uploadToImgbb(makePostRequest("/api/upload-to-imgbb"));
      expect(res.status).toBe(401);
    });
  });

  describe("Tất cả 4 Upload Routes từ chối 403 khi role không phải TEACHER hoặc ADMIN", () => {
    it("upload-document từ chối 403 khi role là STUDENT hoặc PARENT", async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: "student-1", role: "STUDENT" } as any);
      const res1 = await uploadDocument(makePostRequest("/api/upload-document"));
      expect(res1.status).toBe(403);

      vi.mocked(getSession).mockResolvedValue({ userId: "parent-1", role: "PARENT" } as any);
      const res2 = await uploadDocument(makePostRequest("/api/upload-document"));
      expect(res2.status).toBe(403);
    });

    it("upload-image từ chối 403 khi role là STUDENT", async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: "student-1", role: "STUDENT" } as any);
      const res = await uploadImage(makePostRequest("/api/upload-image"));
      expect(res.status).toBe(403);
    });

    it("upload-images từ chối 403 khi role là STUDENT", async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: "student-1", role: "STUDENT" } as any);
      const res = await uploadImages(makePostRequest("/api/upload-images"));
      expect(res.status).toBe(403);
    });

    it("upload-to-imgbb từ chối 403 khi role là STUDENT", async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: "student-1", role: "STUDENT" } as any);
      const res = await uploadToImgbb(makePostRequest("/api/upload-to-imgbb"));
      expect(res.status).toBe(403);
    });
  });

  describe("Upload Validation Helpers", () => {
    it("validImage nhận diện đúng PNG magic bytes", () => {
      const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]);
      expect(validImage(pngHeader)).toBe(true);
      expect(validImage(pngHeader, "image/png")).toBe(true);
      expect(validImage(pngHeader, "image/jpeg")).toBe(false);
    });

    it("validImage từ chối buffer rỗng hoặc file thực thi/script", () => {
      expect(validImage(Buffer.alloc(0))).toBe(false);
      const phpScript = Buffer.from("<?php echo 1; ?>");
      expect(validImage(phpScript)).toBe(false);
    });

    it("decodeImage từ chối dữ liệu không phải base64 ảnh hợp lệ", () => {
      expect(decodeImage("not-a-valid-base64")).toBeNull();
      expect(decodeImage(12345)).toBeNull();
    });
  });
});
