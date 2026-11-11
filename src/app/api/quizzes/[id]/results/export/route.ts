import { getSession } from "@/lib/auth";
import {
  buildQuizResultsExportFilename,
  createQuizResultsCsv,
  createQuizResultsXlsx,
  isQuizResultsExportFormat,
  loadQuizResultsExport,
} from "@/lib/quiz-results-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const classId = url.searchParams.get("classId")?.trim();
  const format = url.searchParams.get("format");

  if (!classId) return new Response("Thiếu lớp cần xuất kết quả.", { status: 400 });
  if (!isQuizResultsExportFormat(format)) return new Response("Định dạng xuất không hợp lệ.", { status: 400 });

  try {
    const result = await loadQuizResultsExport(await getSession(), id, classId);
    if (!result.success) return new Response(result.error, { status: result.status });

    const body = format === "csv"
      ? createQuizResultsCsv(result.data)
      : await createQuizResultsXlsx(result.data);
    const filename = buildQuizResultsExportFilename(result.data.quizTitle, result.data.className, format);

    return new Response(new Uint8Array(body).buffer, {
      headers: {
        "Content-Type": format === "csv"
          ? "text/csv; charset=utf-8"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error exporting quiz results:", error);
    return new Response("Không thể xuất kết quả bài kiểm tra.", { status: 500 });
  }
}
