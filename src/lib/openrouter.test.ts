import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getApiKeys,
  getModelPriority,
  callOpenRouterVision,
  type ChatImage,
} from "./openrouter";

function setEnv(keys: string, models = "") {
  vi.stubEnv("OPENROUTER_API_KEYS", keys);
  vi.stubEnv("OPENROUTER_MODELS", models);
  vi.stubEnv("OPENROUTER_SITE_URL", "https://test.edu");
  vi.stubEnv("OPENROUTER_APP_NAME", "edu-web-test");
}

const images: ChatImage[] = [
  { dataUrl: "data:image/jpeg;base64,AAAA", mime: "image/jpeg" },
];

describe("getApiKeys / getModelPriority", () => {
  beforeEach(() => vi.unstubAllEnvs());
  afterEach(() => vi.unstubAllEnvs());

  it("parse comma-separated keys with trim", () => {
    setEnv(" sk-or-v1-a , sk-or-v1-b ,");
    expect(getApiKeys()).toEqual(["sk-or-v1-a", "sk-or-v1-b"]);
  });

  it("returns empty when not configured", () => {
    vi.stubEnv("OPENROUTER_API_KEYS", undefined);
    expect(getApiKeys()).toEqual([]);
  });

  it("returns default chain when models empty", () => {
    setEnv("sk-or-v1-a");
    vi.stubEnv("OPENROUTER_MODELS", "");
    const m = getModelPriority();
    expect(m[0]).toContain("gemini");
    expect(m.length).toBeGreaterThan(1);
  });

  it("uses env models when provided", () => {
    setEnv("sk-or-v1-a", "model/x:free,model/y:free");
    expect(getModelPriority()).toEqual(["model/x:free", "model/y:free"]);
  });
});

describe("callOpenRouterVision", () => {
  beforeEach(() => {
    vi.stubEnv("OPENROUTER_SITE_URL", "https://test.edu");
    vi.stubEnv("OPENROUTER_APP_NAME", "edu-web-test");
    vi.spyOn(Math, "random").mockReturnValue(0); // luôn bắt đầu từ key 0
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("success path returns assistant text", async () => {
    setEnv("sk-or-v1-a");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: "HELLO" } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await callOpenRouterVision({
      images,
      system: "sys",
      userText: "user",
    });

    expect(result).toBe("HELLO");
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers.Authorization).toBe("Bearer sk-or-v1-a");
    expect(init.headers["HTTP-Referer"]).toBe("https://test.edu");
    expect(init.headers["X-Title"]).toBe("edu-web-test");
    const body = JSON.parse(init.body);
    expect(body.messages[1].content[1].type).toBe("image_url");
  });

  it("random-start distributes across keys (no module cursor)", async () => {
    setEnv("sk-or-v1-a,sk-or-v1-b,sk-or-v1-c");
    const randoms = [0, 0.4, 0.8]; // start key 0,1,2
    let i = 0;
    vi.spyOn(Math, "random").mockImplementation(() => randoms[i++ % randoms.length]);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: "x" } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    for (let n = 0; n < 6; n++) {
      await callOpenRouterVision({ images, system: "s", userText: "u" });
    }
    const usedKeys = new Set(
      fetchMock.mock.calls.map((c) => c[1].headers.Authorization),
    );
    expect(usedKeys.size).toBe(3);
    expect([...usedKeys]).toEqual(
      expect.arrayContaining([
        "Bearer sk-or-v1-a",
        "Bearer sk-or-v1-b",
        "Bearer sk-or-v1-c",
      ]),
    );
  });

  it("429 on all keys → backoff → rotate model → throw", async () => {
    setEnv("sk-or-v1-a,sk-or-v1-b", "model/x:free,model/y:free");
    vi.spyOn(Math, "random").mockReturnValue(0);
    let sleeps = 0;
    vi.spyOn(global, "setTimeout").mockImplementation(((fn: () => void) => {
      sleeps++;
      fn();
      return 0 as unknown as NodeJS.Timeout;
    }) as unknown as typeof setTimeout);

    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 429, text: async () => "" });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      callOpenRouterVision({ images, system: "s", userText: "u" }),
    ).rejects.toThrow(/tất cả key\/model/);

    expect(sleeps).toBeGreaterThanOrEqual(5);
    const modelsTried = fetchMock.mock.calls.map((c) => JSON.parse(c[1].body).model);
    expect(modelsTried).toContain("model/x:free");
    expect(modelsTried).toContain("model/y:free");
  });

  it("400 → jump to next model without exhausting all keys", async () => {
    setEnv("sk-or-v1-a,sk-or-v1-b", "model/x:free,model/y:free");
    vi.spyOn(Math, "random").mockReturnValue(0);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 400, text: async () => "" })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: "OK" } }] }) });
    vi.stubGlobal("fetch", fetchMock);

    const result = await callOpenRouterVision({ images, system: "s", userText: "u" });
    expect(result).toBe("OK");
    const modelsTried = fetchMock.mock.calls.map((c) => JSON.parse(c[1].body).model);
    expect(modelsTried).toEqual(["model/x:free", "model/y:free"]);
  });

  it("throws clear error when no keys configured", async () => {
    vi.stubEnv("OPENROUTER_API_KEYS", undefined);
    await expect(
      callOpenRouterVision({ images, system: "s", userText: "u" }),
    ).rejects.toThrow(/chưa được cấu hình/);
  });

  it("network/timeout error treated as key-level and rotates", async () => {
    setEnv("sk-or-v1-a,sk-or-v1-b", "model/x:free");
    vi.spyOn(Math, "random").mockReturnValue(0);
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: "RECOVERED" } }] }) });
    vi.stubGlobal("fetch", fetchMock);

    const result = await callOpenRouterVision({ images, system: "s", userText: "u" });
    expect(result).toBe("RECOVERED");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer sk-or-v1-b");
  });
});
