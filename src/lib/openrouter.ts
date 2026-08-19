// Client gọi OpenRouter vision với 2 cơ chế chống nghẽn:
//  - Key Rotation: chọn ngẫu nhiên key bắt đầu, xoay vòng khi gặp lỗi theo key.
//  - Model Fallback: tự chuyển sang model kế trong danh sách ưu tiên khi model lỗi.
// Thiết kế KHÔNG dùng shared state (không module-level cursor) → chạy được cả
// long-running server lẫn serverless (phân bổ tải thống kê đều qua random-start).

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const DEFAULT_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen2.5-vl-72b-instruct:free",
  "meta-llama/llama-3.2-11b-vision-instruct:free",
  "mistralai/mistral-7b-instruct:free",
];

// Delay giữa các lần xoay key (chống thundering-herd khi nhiều request đồng loạt)
const KEY_ROTATE_JITTER_MS = 200;
// Delay khi TẤT CẢ key của 1 model đều 429 → trước khi nhảy sang model kế
const MODEL_ROTATE_BACKOFF_MS = 800;
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_TOKENS = 4096;

export interface ChatImage {
  dataUrl: string; // "data:<mime>;base64,..."
  mime: string;
}

export function getApiKeys(): string[] {
  const raw = process.env.OPENROUTER_API_KEYS;
  if (!raw) return [];
  const keys = raw
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
  return keys;
}

export function getModelPriority(): string[] {
  const raw = process.env.OPENROUTER_MODELS;
  if (!raw) return [...DEFAULT_MODELS];
  const models = raw
    .split(",")
    .map((m) => m.trim())
    .filter((m) => m.length > 0);
  return models.length > 0 ? models : [...DEFAULT_MODELS];
}

// Status code phân loại lỗi để quyết định xoay key hay xoay model
function isKeyLevelStatus(status: number): boolean {
  // 429 rate-limit, 401/403 auth (key có thể bị khoá), 5xx lỗi tạm thời của upstream
  return status === 429 || status === 401 || status === 403 || (status >= 500 && status <= 504);
}
function isModelLevelStatus(status: number): boolean {
  // 400 bad request, 402 payment/model bị khoá, 404 model không tồn tại, 422 unprocessable
  return status === 400 || status === 402 || status === 404 || status === 422;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const randomStartIndex = (length: number) =>
  length <= 0 ? 0 : Math.floor(Math.random() * length);

export interface CallOpenRouterVisionOptions {
  images: ChatImage[];
  system: string;
  userText: string;
  maxTokens?: number;
  timeoutMs?: number;
}

// Gọi OpenRouter vision, tự động xoay key + fallback model.
// Trả về nội dung text trong message của assistant (Route sẽ parse JSON).
// Ném Error có message vô hại (KHÔNG chứa API key) nếu tất cả key/model đều thất bại.
export async function callOpenRouterVision(opts: CallOpenRouterVisionOptions): Promise<string> {
  const { images, system, userText, maxTokens = DEFAULT_MAX_TOKENS, timeoutMs = DEFAULT_TIMEOUT_MS } = opts;

  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error("OPENROUTER_API_KEYS chưa được cấu hình trong .env");
  }
  const models = getModelPriority();

  const lastModelIdx = models.length - 1;

  let lastError: unknown = null;

  for (let m = 0; m < models.length; m++) {
    const model = models[m];
    const startKey = randomStartIndex(keys.length);

    for (let k = 0; k < keys.length; k++) {
      const key = keys[(startKey + k) % keys.length];

      try {
        const res = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "",
            "X-Title": process.env.OPENROUTER_APP_NAME || "edu-web",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: system },
              {
                role: "user",
                content: [
                  { type: "text", text: userText },
                  ...images.map((img) => ({ type: "image_url", image_url: { url: img.dataUrl } })),
                ],
              },
            ],
            max_tokens: maxTokens,
            temperature: 0.2,
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (res.ok) {
          const data = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          const text = data?.choices?.[0]?.message?.content ?? "";
          return text;
        }

        // Đọc body để giải phóng connection & bắt gợi ý unsupported model
        const bodyText = await res.text().catch(() => "");
        lastError = new Error(`OpenRouter ${model} trả status ${res.status}`);

        if (isKeyLevelStatus(res.status)) {
          // Xoay key tiếp theo (có jitter chống thundering-herd)
          await sleep(KEY_ROTATE_JITTER_MS);
          continue;
        }
        if (isModelLevelStatus(res.status) || /unsupported_model|model.*not.*found/i.test(bodyText)) {
          // Nhảy sang model kế ngay (không lãng phí key)
          break;
        }
        // Các status khác: coi như lỗi tạm, xoay key
        await sleep(KEY_ROTATE_JITTER_MS);
        continue;
      } catch (err) {
        // Network error / timeout (AbortError) → coi như key-level, xoay key
        lastError = err;
        await sleep(KEY_ROTATE_JITTER_MS);
        continue;
      }
    }

    // Đã thử hết mọi key của model này mà không thành công → backoff rồi sang model kế
    if (m < lastModelIdx) {
      await sleep(MODEL_ROTATE_BACKOFF_MS);
    }
  }

  const reason = lastError instanceof Error ? lastError.message : "lỗi không xác định";
  throw new Error(`Không thể sinh nội dung từ AI sau khi thử tất cả key/model. Nguyên nhân: ${reason}`);
}
