"use client";

import type { ChatImage } from "@/lib/openrouter";
import type { PDFPageProxy } from "pdfjs-dist";

// Giới hạn kích thước ảnh trước khi gửi vision model (chống vượt quota free-tier
// trước khi kịp fallback sang model khác).
const MAX_DIM = 1600; // px — cạnh dài nhất của canvas sau resize
const MAX_IMG_BYTES = 800_000; // ~600KB base64 mỗi ảnh
const MAX_TOTAL_BYTES = 6_000_000; // ~4.5MB base64 tổng (10 ảnh ~ 600KB)
const DEFAULT_QUALITY = 0.7;
const FALLBACK_QUALITY = 0.5;

function loadPdfjs() {
  // pdfjs-dist chỉ load phía client; worker copy vào public/ bởi scripts/copy-pdf-worker.mjs
  return import("pdfjs-dist").then((pdfjsLib) => {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf/pdf.worker.min.mjs";
    }
    return pdfjsLib;
  });
}

// Render PDFPageProxy → canvas (pdfjs v6 render yêu cầu `canvas: HTMLCanvasElement`)
async function renderPageToCanvas(page: PDFPageProxy): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale: 1 });
  const scale = Math.min(1, MAX_DIM / Math.max(viewport.width, viewport.height));
  const scaledViewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(scaledViewport.width);
  canvas.height = Math.floor(scaledViewport.height);
  if (!canvas.getContext("2d")) throw new Error("Không tạo được canvas context");
  await page.render({ canvas, viewport: scaledViewport }).promise;
  return canvas;
}

// Nén canvas thành JPEG dataUrl (quality giảm dần nếu vượt giới hạn)
function compressCanvas(canvas: HTMLCanvasElement): string {
  let dataUrl = canvas.toDataURL("image/jpeg", DEFAULT_QUALITY);
  if (dataUrl.length > MAX_IMG_BYTES) {
    dataUrl = canvas.toDataURL("image/jpeg", FALLBACK_QUALITY);
  }
  return dataUrl;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Chuyển 1 file (PDF hoặc ảnh) thành mảng ChatImage đã nén.
// PDF: mỗi trang = 1 ảnh (render qua pdfjs). Ảnh: 1 ảnh (nén nếu vượt giới hạn).
// maxPages: giới hạn số trang PDF xử lý (default 5, user có thể tăng tối đa 10).
export async function fileToImages(file: File, maxPages = 5): Promise<ChatImage[]> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    const pdfjsLib = await loadPdfjs();
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pageCount = Math.min(pdf.numPages, Math.max(1, maxPages));
    const images: ChatImage[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const canvas = await renderPageToCanvas(page);
      const dataUrl = compressCanvas(canvas);
      if (dataUrl) images.push({ dataUrl, mime: "image/jpeg" });

      // Tổng payload guard: dừng thêm trang nếu đã vượt ngưỡng
      const total = images.reduce((sum, img) => sum + img.dataUrl.length, 0);
      if (total > MAX_TOTAL_BYTES) break;
    }
    return enforceTotalLimit(images);
  }

  // Ảnh PNG/JPG: load qua FileReader, vẽ lên canvas để resize+nén nếu cần
  const dataUrl = await fileToDataUrl(file);
  if (dataUrl.length > MAX_IMG_BYTES) {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Không thể đọc ảnh"));
      img.src = dataUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(img.naturalWidth, MAX_DIM);
    canvas.height = Math.min(img.naturalHeight, MAX_DIM);
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const compressed = compressCanvas(canvas);
    return enforceTotalLimit([{ dataUrl: compressed || dataUrl, mime: "image/jpeg" }]);
  }
  return [{ dataUrl, mime: file.type || "image/jpeg" }];
}

// Bỏ bớt trang cuối nếu tổng payload vượt MAX_TOTAL_BYTES (giữ trang đầu).
function enforceTotalLimit(images: ChatImage[]): ChatImage[] {
  let total = images.reduce((sum, img) => sum + img.dataUrl.length, 0);
  const result = [...images];
  while (total > MAX_TOTAL_BYTES && result.length > 1) {
    const removed = result.pop()!;
    total -= removed.dataUrl.length;
  }
  return result;
}
