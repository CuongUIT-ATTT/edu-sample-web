import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { callOpenRouterVision, type ChatImage } from "@/lib/openrouter";
import { normalizeQuestions } from "@/lib/quiz-import";

const MAX_IMAGES = 10;
const MAX_TOTAL_BYTES = 6_000_000; // khớp với giới hạn client
const MAX_QUESTIONS = 50;

const SYSTEM_PROMPT = `Bạn là chuyên gia soạn đề thi. Nhiệm vụ: đọc ảnh đề thi/trắc nghiệm và trích xuất thành cấu trúc câu hỏi.
CHỈ trả về một JSON hợp lệ, không dùng markdown, không giải thích thêm. Schema:
{
  "title": "Tiêu đề đề thi (tùy chọn)",
  "questions": [
    {
      "questionText": "Nội dung câu hỏi",
      "type": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "0",
      "score": 1,
      "explanation": "Giải thích (tùy chọn)"
    }
  ]
}
Quy tắc:
- MULTIPLE_CHOICE: options là mảng 4 đáp án, correctAnswer là index chuỗi "0".."3".
- TRUE_FALSE: questionText là bối cảnh, options là 4 phát biểu, correctAnswer dạng "T,F,T,T" (T=đúng, F=sai).
- SHORT_ANSWER: options là mảng rỗng [], correctAnswer là đáp án ngắn.
- Chỉ lấy câu hỏi thực sự có trong ảnh. Nếu không rõ đáp án, ghi chú trong explanation.`;

function stripMarkdownFence(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  return text.trim();
}

function isValidDataUrl(s: unknown): s is string {
  return typeof s === "string" && /^data:[a-zA-Z0-9/+-]+;base64,/.test(s);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Chỉ giảng viên hoặc quản trị viên mới được dùng tính năng này." }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as {
      images?: unknown;
      maxQuestions?: unknown;
      subject?: unknown;
    } | null;

    if (!body || !Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json({ error: "Thiếu ảnh đầu vào." }, { status: 400 });
    }

    const images: ChatImage[] = body.images
      .filter((img): img is { dataUrl: string; mime: string } =>
        isObject(img) && typeof img.dataUrl === "string" && typeof img.mime === "string")
      .map((img) => ({ dataUrl: img.dataUrl, mime: img.mime }))
      .filter((img) => isValidDataUrl(img.dataUrl))
      .slice(0, MAX_IMAGES);

    if (images.length === 0) {
      return NextResponse.json({ error: "Không có ảnh hợp lệ." }, { status: 400 });
    }

    const totalBytes = images.reduce((sum, img) => sum + img.dataUrl.length, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      return NextResponse.json({ error: "Tổng kích thước ảnh quá lớn. Hãy giảm số trang." }, { status: 413 });
    }

    const maxQuestions = Math.min(
      MAX_QUESTIONS,
      Math.max(1, Math.floor(Number(body.maxQuestions) || 20)),
    );
    const subject = typeof body.subject === "string" && body.subject.trim() ? body.subject.trim() : "";

    const userText = [
      subject ? `Môn học: ${subject}.` : "",
      `Hãy trích xuất tối đa ${maxQuestions} câu hỏi từ ảnh đề thi đính kèm.`,
      `Đây là ảnh đề thi, hãy trích xuất các câu hỏi và đáp án chính xác.`,
    ]
      .filter(Boolean)
      .join("\n");

    const rawText = await callOpenRouterVision({
      images,
      system: SYSTEM_PROMPT,
      userText,
      maxTokens: 4096,
    });

    const parsed = JSON.parse(stripMarkdownFence(rawText));
    const questions = normalizeQuestions(parsed?.questions);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "AI không trích xuất được câu hỏi nào. Thử ảnh rõ hơn hoặc ít trang hơn." },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      title: typeof parsed?.title === "string" ? parsed.title : undefined,
      questions,
    });
  } catch (err) {
    // Không log key; chỉ log thông điệp vô hại
    const message = err instanceof Error ? err.message : "Lỗi hệ thống khi sinh đề thi bằng AI.";
    const status = /chưa được cấu hình/.test(message) ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
