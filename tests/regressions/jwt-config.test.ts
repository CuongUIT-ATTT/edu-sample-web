import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use actual auth functions without global mocks
vi.unmock("@/lib/auth");

describe("P0 - JWT Secret Configuration & Fail-Closed Behavior", () => {
  const originalEnv = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = originalEnv;
  });

  it("fail closed: ném lỗi rõ ràng khi thiếu JWT_SECRET", async () => {
    delete process.env.JWT_SECRET;
    const { getJWTKey, signJWT } = await import("@/lib/auth");

    expect(() => getJWTKey()).toThrow("JWT_SECRET must contain at least 32 bytes");
    await expect(signJWT({ userId: "u1", role: "ADMIN", email: "u1@test.local", name: "User 1", isRoot: false })).rejects.toThrow(
      "JWT_SECRET must contain at least 32 bytes"
    );
  });

  it("fail closed: từ chối JWT_SECRET quá ngắn (< 32 bytes)", async () => {
    process.env.JWT_SECRET = "too-short-secret";
    const { getJWTKey, signJWT } = await import("@/lib/auth");

    expect(() => getJWTKey()).toThrow("JWT_SECRET must contain at least 32 bytes");
    await expect(signJWT({ userId: "u1", role: "ADMIN", email: "u1@test.local", name: "User 1", isRoot: false })).rejects.toThrow(
      "JWT_SECRET must contain at least 32 bytes"
    );
  });

  it("fail closed: từ chối JWT_SECRET có khoảng trắng ở đầu hoặc cuối", async () => {
    process.env.JWT_SECRET = "  test-secret-with-spaces-at-least-32-chars  ";
    const { getJWTKey, signJWT } = await import("@/lib/auth");

    expect(() => getJWTKey()).toThrow("without surrounding whitespace");
    await expect(signJWT({ userId: "u1", role: "ADMIN", email: "u1@test.local", name: "User 1", isRoot: false })).rejects.toThrow(
      "without surrounding whitespace"
    );
  });

  it("hoạt động chuẩn xác khi cấu hình JWT_SECRET hợp lệ >= 32 bytes", async () => {
    process.env.JWT_SECRET = "super-secure-production-ready-jwt-key-32-bytes";
    const { signJWT, verifyJWT } = await import("@/lib/auth");

    const payload = { userId: "user-123", role: "TEACHER" as const, email: "teacher@test.local", name: "Teacher Test", isRoot: false };
    const token = await signJWT(payload);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const decoded = await verifyJWT(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe("user-123");
    expect(decoded?.role).toBe("TEACHER");
  });

  it("verifyJWT trả về null khi token bị giả mạo hoặc sai chữ ký", async () => {
    process.env.JWT_SECRET = "super-secure-production-ready-jwt-key-32-bytes";
    const { verifyJWT } = await import("@/lib/auth");

    const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fakeSignature";
    const result = await verifyJWT(fakeToken);
    expect(result).toBeNull();
  });

  it("verifyJWT trả về null khi role không nằm trong whitelist hợp lệ", async () => {
    process.env.JWT_SECRET = "super-secure-production-ready-jwt-key-32-bytes";
    const { signJWT, verifyJWT } = await import("@/lib/auth");

    // Giả mạo payload với role Hacker
    const token = await signJWT({ userId: "user-123", role: "HACKER" as any, email: "h@test.local", name: "Hacker", isRoot: false });
    const result = await verifyJWT(token);
    expect(result).toBeNull();
  });
});
