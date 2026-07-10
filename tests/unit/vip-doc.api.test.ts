import { describe, it, expect } from "vitest";

interface MockDocResponse {
  status: number;
  body: { error?: string } | string;
  headers?: { "Content-Type": string };
}

// Mock implementation of Route Handler logic
async function mockGetVipDoc(
  session: { role: string; name: string } | null, 
  filename: string
): Promise<MockDocResponse> {
  if (!session) {
    return { status: 401, body: { error: "Unauthenticated" } };
  }
  
  const allowedRoles = ["STUDENT", "TEACHER", "PARENT", "ADMIN"];
  if (!allowedRoles.includes(session.role)) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  return { 
    status: 200, 
    headers: { "Content-Type": "application/pdf" },
    body: `VIP Document Stream: ${filename}`
  };
}

describe("VIP Document API Route Handler Authorization", () => {
  it("should return 401 when no session is present", async () => {
    const res = await mockGetVipDoc(null, "lecture-1.pdf");
    expect(res.status).toBe(401);
    const body = res.body as { error: string };
    expect(body.error).toBe("Unauthenticated");
  });

  it("should return 403 when session role is GUEST or other unallowed roles", async () => {
    const res = await mockGetVipDoc({ role: "GUEST", name: "Guest User" }, "lecture-1.pdf");
    expect(res.status).toBe(403);
    const body = res.body as { error: string };
    expect(body.error).toBe("Forbidden");
  });

  it("should return 200 when student is authenticated", async () => {
    const res = await mockGetVipDoc({ role: "STUDENT", name: "Nguyễn Văn A" }, "lecture-1.pdf");
    expect(res.status).toBe(200);
    expect(res.headers?.["Content-Type"]).toBe("application/pdf");
  });
});
