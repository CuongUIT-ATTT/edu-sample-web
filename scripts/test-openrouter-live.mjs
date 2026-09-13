import { readFileSync } from "node:fs";
import { callOpenRouterVision } from "../src/lib/openrouter.ts";

const buf = readFileSync(new URL("./sample-exam.png", import.meta.url));
const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;

const SYSTEM = `Bạn là chuyên gia soạn đề thi. CHỈ trả về JSON hợp lệ, không markdown.
Schema: {"title":string,"questions":[{"questionText":string,"type":"MULTIPLE_CHOICE","options":[string,string,string,string],"correctAnswer":"0","score":1}]}`;

const userText = `Hãy trích xuất tối đa 10 câu hỏi từ ảnh đề thi đính kèm.`;

console.log("Calling OpenRouter with live keys (random-start + fallback)...\n");
try {
  const raw = await callOpenRouterVision({
    images: [{ dataUrl, mime: "image/png" }],
    system: SYSTEM,
    userText,
    maxTokens: 2048,
  });
  console.log("=== RAW RESPONSE ===");
  console.log(raw.slice(0, 1500));
  const parsed = JSON.parse(raw.replace(/```(?:json)?/i, "").replace(/```/g, "").trim());
  console.log("\n=== PARSED QUESTIONS ===");
  console.log(JSON.stringify(parsed.questions ?? parsed, null, 2).slice(0, 1500));
} catch (err) {
  console.error("ERROR:", err instanceof Error ? err.message : err);
  process.exit(1);
}
