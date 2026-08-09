"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Scissors,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  PlusCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { showToast } from "@/components/Toast";

export interface PdfQuestionLike {
  questionText: string;
  type: string;
}

export interface PdfRegion {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  w: number;
  h: number;
  questionIndex: number | null;
  status?: "pending" | "uploaded" | "error";
}

interface PDFRegionSelectorProps {
  file: File;
  questions: PdfQuestionLike[];
  onAttachImage: (questionIndex: number, url: string) => void;
  onAddBlankQuestions?: (count: number) => void;
}

// pdfjs-dist chỉ load phía client; worker copy vào public/ để tránh lỗi MIME
async function loadPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf/pdf.worker.min.mjs";
  }
  return pdfjsLib;
}

const MAX_DIM = 2400; // cap resolution khi render trang (tránh phình bộ nhớ)
const CROP_MAX = 2048; // cap crop trước khi JPEG
const MIN_REGION = 6; // bỏ qua vùng quá nhỏ (click vô tình)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function PDFRegionSelector({
  file,
  questions,
  onAttachImage,
  onAddBlankQuestions,
}: PDFRegionSelectorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [regions, setRegions] = useState<PdfRegion[]>([]);
  const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number } | null>(null);
  // Zoom hiển thị PDF (100% = kích thước cơ sở). Region dùng % nên vẫn chính xác khi zoom.
  const [zoomScale, setZoomScale] = useState(1);
  const [fitToScreen, setFitToScreen] = useState(true);

  const pagesRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragCurrentRef = useRef<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── Load PDF ─────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadTaskRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const pdfjsLib = await loadPdfjs();
        const data = await file.arrayBuffer();
        const loadTask = pdfjsLib.getDocument({ data });
        loadTaskRef.current = loadTask;
        const doc = await loadTask.promise;
        if (cancelled) { loadTask.destroy(); return; }
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoadingPdf(false);
      } catch (e) {
        console.error("PDF load error:", e);
        if (!cancelled) {
          setLoadingPdf(false);
          showToast("Không đọc được PDF (hỏng hoặc có mật khẩu).", "error");
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [file]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      pagesRef.current.clear();
      loadTaskRef.current?.destroy?.();
    };
  }, []);

  // ── Render trang PDF ─────────────────────────────────────
  const renderPage = useCallback(async (pageIndex: number): Promise<HTMLCanvasElement | null> => {
    const cached = pagesRef.current.get(pageIndex);
    if (cached) return cached;
    if (!pdfDoc) return null;

    try {
      const page = await pdfDoc.getPage(pageIndex + 1);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(2, MAX_DIM / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
      pagesRef.current.set(pageIndex, canvas);
      return canvas;
    } catch (e) {
      console.error(`Render page ${pageIndex + 1} error:`, e);
      return null;
    }
  }, [pdfDoc]);

  const ensurePageRendered = useCallback(async (pageIndex: number) => {
    return renderPage(pageIndex);
  }, [renderPage]);

  // Render trang hiện tại khi pdfDoc/currentPage đổi
  useEffect(() => {
    if (!pdfDoc) return;
    let cancelled = false;
    setPageLoading(true);
    renderPage(currentPage).then((canvas) => {
      if (!cancelled) {
        if (canvasRef.current && canvas) {
          canvasRef.current.width = canvas.width;
          canvasRef.current.height = canvas.height;
          const ctx = canvasRef.current.getContext("2d");
          ctx?.drawImage(canvas, 0, 0);
          setCanvasSize({ w: canvas.width, h: canvas.height });
        }
        setPageLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [pdfDoc, currentPage, renderPage]);

  // ── Vẽ vùng bằng chuột ───────────────────────────────────
  const toCanvasPx = (e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const canvas = canvasRef.current!;
    return {
      x: Math.min(canvas.width, Math.max(0, ((e.clientX - rect.left) / rect.width) * canvas.width)),
      y: Math.min(canvas.height, Math.max(0, ((e.clientY - rect.top) / rect.height) * canvas.height)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Bỏ qua nếu bấm vào control của region (dropdown/nút)
    if ((e.target as HTMLElement).closest("[data-region-control]")) return;
    const p = toCanvasPx(e);
    dragStartRef.current = p;
    dragCurrentRef.current = p;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      console.error("setPointerCapture error:", err);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const p = toCanvasPx(e);
    dragCurrentRef.current = p;
    const start = dragStartRef.current;
    setDraft({
      x: Math.min(start.x, p.x),
      y: Math.min(start.y, p.y),
      w: Math.abs(p.x - start.x),
      h: Math.abs(p.y - start.y),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // Tính region từ ref (không phụ thuộc state draft stale)
    if (dragStartRef.current) {
      const start = dragStartRef.current;
      const end = toCanvasPx(e);
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);
      if (w >= MIN_REGION && h >= MIN_REGION) {
        const region: PdfRegion = {
          id: crypto.randomUUID(),
          pageIndex: currentPage,
          x: Math.round(x),
          y: Math.round(y),
          w: Math.round(w),
          h: Math.round(h),
          questionIndex: null,
          status: "pending",
        };
        setRegions((prev) => [...prev, region]);
      }
    }
    dragStartRef.current = null;
    dragCurrentRef.current = null;
    setDraft(null);
  };

  const removeRegion = (id: string) => {
    setRegions((prev) => prev.filter((r) => r.id !== id));
  };

  const setRegionQuestion = (id: string, questionIndex: number) => {
    setRegions((prev) => prev.map((r) => (r.id === id ? { ...r, questionIndex } : r)));
  };

  // ── Crop + upload ────────────────────────────────────────
  const cropRegion = async (r: PdfRegion): Promise<string | null> => {
    const src = await ensurePageRendered(r.pageIndex);
    if (!src) return null;
    let w = Math.max(1, Math.round(r.w));
    let h = Math.max(1, Math.round(r.h));
    if (Math.max(w, h) > CROP_MAX) {
      const s = CROP_MAX / Math.max(w, h);
      w = Math.round(w * s);
      h = Math.round(h * s);
    }
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const ctx = out.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(src, r.x, r.y, r.w, r.h, 0, 0, w, h);
    return out.toDataURL("image/jpeg", 0.9);
  };

  const uploadWithRetry = async (dataUrl: string): Promise<string | null> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch("/api/upload-to-imgbb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
          signal: AbortSignal.timeout(35000),
        });
        const json = await res.json();
        if (json.url) return json.url as string;
        console.error("ImgBB fail:", json.error);
      } catch (err) {
        console.error("Upload error:", err);
      }
      await sleep(2000); // ImgBB rate-limit ~1 req/s
    }
    return null;
  };

  const handleCropAll = async () => {
    const toUpload = regions.filter((r) => r.questionIndex != null);
    if (toUpload.length === 0) {
      showToast("Hãy gán ít nhất 1 vùng vào câu hỏi trước khi crop.", "warning");
      return;
    }
    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < toUpload.length; i++) {
      const r = toUpload[i];
      // Câu bị xoá sau khi gán → bỏ qua
      if (r.questionIndex! >= questions.length) {
        setRegions((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "error" } : x)));
        errorCount++;
        continue;
      }
      showToast(`Đang crop & upload ${i + 1}/${toUpload.length}...`, "info");
      const dataUrl = await cropRegion(r);
      const url = dataUrl ? await uploadWithRetry(dataUrl) : null;
      if (url) {
        onAttachImage(r.questionIndex!, url);
        setRegions((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "uploaded" } : x)));
        successCount++;
      } else {
        setRegions((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "error" } : x)));
        errorCount++;
      }
      if (i < toUpload.length - 1) await sleep(2000);
    }

    setUploading(false);
    showToast(
      errorCount === 0
        ? `Đã gắn ${successCount} ảnh crop vào câu hỏi!`
        : `Gắn thành công ${successCount}, thất bại ${errorCount} vùng.`,
      errorCount === 0 ? "success" : "warning",
    );
  };

  // ── Helpers hiển thị ─────────────────────────────────────
  const canvasW = canvasSize?.w ?? 1;
  const canvasH = canvasSize?.h ?? 1;

  const pctStyle = (r: { x: number; y: number; w: number; h: number }) => ({
    left: `${(r.x / canvasW) * 100}%`,
    top: `${(r.y / canvasH) * 100}%`,
    width: `${(r.w / canvasW) * 100}%`,
    height: `${(r.h / canvasH) * 100}%`,
  });

  const pageRegions = regions.filter((r) => r.pageIndex === currentPage);

  return (
    <div className="border border-divider rounded-lg p-4 bg-surface-pearl flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <span className="text-xs font-bold text-ink flex items-center gap-1.5">
          <Scissors className="h-4 w-4 text-purple-600" /> PDF → Chọn vùng ảnh gắn câu hỏi
        </span>
        <span className="text-[10px] text-ink-muted-48 flex items-center gap-1 truncate max-w-[240px]">
          <FileText className="h-3 w-3 flex-shrink-0" /> {file.name}
        </span>
      </div>

      {loadingPdf ? (
        <div className="flex flex-col items-center py-10 gap-2">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="text-xs text-ink-muted-80">Đang tải PDF...</span>
        </div>
      ) : (
        <>
          {/* Pagination + Zoom */}
          {numPages > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-2 sm:gap-3">
              {/* Page nav */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-1 rounded border border-hairline bg-canvas hover:bg-surface disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold text-ink-muted-80">
                  Trang {currentPage + 1} / {numPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(numPages - 1, p + 1))}
                  disabled={currentPage === numPages - 1}
                  className="p-1 rounded border border-hairline bg-canvas hover:bg-surface disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Zoom controls */}
              <div className="flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => { setZoomScale((z) => Math.max(0.25, +(z - 0.25).toFixed(2))); setFitToScreen(false); }}
                  className="px-2 py-1 rounded border border-hairline bg-canvas hover:bg-surface text-xs font-bold text-ink-muted-80"
                  title="Thu nhỏ"
                >
                  −
                </button>
                <span className="text-[11px] font-semibold text-ink-muted-80 w-14 text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => { setZoomScale((z) => Math.min(4, +(z + 0.25).toFixed(2))); setFitToScreen(false); }}
                  className="px-2 py-1 rounded border border-hairline bg-canvas hover:bg-surface text-xs font-bold text-ink-muted-80"
                  title="Phóng to"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => { setFitToScreen(true); setZoomScale(1); }}
                  className={`px-2 py-1 rounded border text-[11px] font-semibold ${fitToScreen ? "border-primary text-primary bg-primary-muted-12" : "border-hairline bg-canvas hover:bg-surface text-ink-muted-80"}`}
                  title="Vừa màn hình"
                >
                  Vừa màn hình
                </button>
              </div>
            </div>
          )}

          {/* Canvas + regions — overflow-x để scroll ngang khi phóng to */}
          <div ref={containerRef} className="relative mx-auto w-fit max-w-full overflow-x-auto select-none" style={{ touchAction: "none" }}>
            {pageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="block mx-auto border border-hairline shadow-sm rounded bg-white"
              style={
                fitToScreen
                  ? { maxWidth: "100%", maxHeight: "70vh", width: "auto", height: "auto" }
                  : { width: `${Math.round(zoomScale * 100)}%`, maxWidth: "100%", height: "auto" }
              }
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />

            {/* Region đang kéo */}
            {draft && (
              <div
                className="absolute border-2 border-purple-500 bg-purple-500/20 pointer-events-none"
                style={pctStyle(draft)}
              />
            )}

            {/* Region đã hoàn tất trên trang hiện tại */}
            {pageRegions.map((r) => {
              const idx = regions.indexOf(r);
              return (
                <div
                  key={r.id}
                  className="absolute border-2 border-blue-400 bg-blue-400/10 flex items-start"
                  style={pctStyle(r)}
                  data-region-control
                >
                  <div
                    className="flex items-center gap-1 -mt-1 -ml-1 px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold shadow-sm"
                    style={{ zIndex: 30 }}
                  >
                    #{idx + 1}
                  </div>
                  <div
                    className="absolute top-0 right-0 flex flex-col gap-1 items-end p-1"
                    style={{ zIndex: 30 }}
                  >
                    <div className="flex items-center gap-1">
                      {r.status === "uploaded" && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                      {r.status === "error" && <XCircle className="h-3 w-3 text-red-500" />}
                      <button
                        type="button"
                        onClick={() => removeRegion(r.id)}
                        className="p-0.5 rounded bg-white/90 border border-red-200 text-red-500 hover:bg-red-50"
                        title="Xoá vùng"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div
                    className="absolute -bottom-8 left-0 flex items-center gap-1"
                    style={{ zIndex: 30 }}
                  >
                    <select
                      value={r.questionIndex ?? ""}
                      onChange={(e) => setRegionQuestion(r.id, Number(e.target.value))}
                      className="text-[10px] border border-hairline rounded px-1 py-0.5 bg-white max-w-[180px]"
                    >
                      <option value="">Gán vào câu...</option>
                      {questions.length === 0 && (
                        <option value="" disabled>Chưa có câu hỏi</option>
                      )}
                      {questions.map((q, i) => (
                        <option key={i} value={i}>
                          Câu {i + 1}: {(q.questionText || "").slice(0, 40)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-ink-muted-48">
            Kéo chuột trên trang để tạo vùng ảnh. Mỗi vùng sau đó gán vào một câu hỏi bằng dropdown dưới vùng.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {questions.length === 0 && onAddBlankQuestions && (
              <button
                type="button"
                onClick={() => onAddBlankQuestions(1)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-pill border border-dashed border-purple-400 text-purple-700 hover:bg-purple-50"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Thêm câu hỏi trống
              </button>
            )}
            <button
              type="button"
              onClick={handleCropAll}
              disabled={uploading}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-pill shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Scissors className="h-3.5 w-3.5" />}
              {uploading ? "Đang crop & upload..." : "Crop & gắn ảnh"}
            </button>
            {regions.length > 0 && (
              <button
                type="button"
                onClick={() => setRegions([])}
                className="text-xs px-3 py-1.5 rounded-pill border border-hairline text-ink-muted-80 hover:bg-surface"
              >
                Xoá tất cả vùng ({regions.length})
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
