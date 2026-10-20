import { readFile } from "node:fs/promises";
import path from "node:path";
import { getQuizCandidates } from "@/actions/quizzes";
import { getSession } from "@/lib/auth";
import { createQuizCandidatePdf } from "@/lib/quiz-candidate-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fileNamePart(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "ma-du-thi";
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    return new Response("Bạn không có quyền tải danh sách mã dự thi.", { status: 401 });
  }

  const { id } = await params;
  const classId = new URL(request.url).searchParams.get("classId")?.trim();
  if (!classId) return new Response("Thiếu lớp cần xuất mã dự thi.", { status: 400 });

  const result = await getQuizCandidates(id);
  if (!result.success || !result.data || !result.quiz) {
    return new Response(result.error || "Không thể tải danh sách mã dự thi.", { status: 403 });
  }

  const targetClass = result.quiz.classes.find((item) => item.classId === classId);
  if (!targetClass) return new Response("Lớp không thuộc đề thi này.", { status: 404 });

  const candidates = result.data
    .filter((candidate) => candidate.classId === classId && !candidate.isRevoked)
    .map((candidate) => ({
      name: candidate.name,
      code: candidate.code,
      effectiveMaxSubmissions: candidate.effectiveMaxSubmissions,
    }));

  const [regularFont, boldFont] = await Promise.all([
    readFile(path.join(process.cwd(), "public", "DejaVuSans.ttf")),
    readFile(path.join(process.cwd(), "public", "DejaVuSans-Bold.ttf")),
  ]);
  const body = await createQuizCandidatePdf({
    quizTitle: result.quiz.title,
    className: targetClass.className,
    maxSubmissions: result.quiz.maxSubmissions,
    candidates,
    regularFont,
    boldFont,
  });
  const filename = `ma-du-thi-${fileNamePart(result.quiz.title)}-${fileNamePart(targetClass.className)}.pdf`;

  return new Response(body as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
