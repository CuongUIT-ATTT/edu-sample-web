import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { mockDb } from "../setup";
import { GET } from "@/app/api/attendance/route";

describe("P0 - Attendance API Authorization & IDOR Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeRequest(params: Record<string, string>) {
    const url = new URL("http://localhost:3000/api/attendance");
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return new NextRequest(url);
  }

  it("từ chối 401 Unauthorized khi truy cập ẩn danh (không session)", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const req = makeRequest({ studentId: "s1", from: "1", to: "12", year: "2026" });
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("trả về 400 khi thiếu hoặc sai tham số đầu vào", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "u1", role: "ADMIN" } as any);

    // Thiếu studentId
    const res1 = await GET(makeRequest({ from: "1", to: "12", year: "2026" }));
    expect(res1.status).toBe(400);

    // Sai tháng (> 12)
    const res2 = await GET(makeRequest({ studentId: "s1", from: "1", to: "13", year: "2026" }));
    expect(res2.status).toBe(400);
  });

  it("trả về 403 Forbidden khi role không hợp lệ", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "u1", role: "UNKNOWN" as any } as any);
    const req = makeRequest({ studentId: "s1", from: "1", to: "12", year: "2026" });
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it("chống IDOR: STUDENT không thể xem điểm danh của học sinh khác (trả về 404)", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "student-user-1", role: "STUDENT" } as any);
    // findFirst trả về null vì studentProfile không khớp userId trong scope
    mockDb.studentProfile.findFirst.mockResolvedValue(null);

    const req = makeRequest({ studentId: "victim-student-id", from: "1", to: "12", year: "2026" });
    const res = await GET(req);

    expect(res.status).toBe(404);
    expect(mockDb.studentProfile.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [
          { id: "victim-student-id" },
          { userId: "student-user-1" },
        ],
      },
      select: { id: true },
    });
  });

  it("STUDENT truy vấn đúng profile của chính mình thành công (200 OK)", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "student-user-1", role: "STUDENT" } as any);
    mockDb.studentProfile.findFirst.mockResolvedValue({ id: "my-student-id" });
    mockDb.attendance.findMany.mockResolvedValue([
      { id: "att-1", status: "PRESENT", date: new Date("2026-03-01") },
    ]);

    const req = makeRequest({ studentId: "my-student-id", from: "3", to: "3", year: "2026" });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.records).toHaveLength(1);
    expect(json.records[0].status).toBe("PRESENT");
  });

  it("ADMIN có quyền xem điểm danh của bất kỳ học sinh nào", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "admin-1", role: "ADMIN" } as any);
    mockDb.studentProfile.findFirst.mockResolvedValue({ id: "any-student-id" });
    mockDb.attendance.findMany.mockResolvedValue([]);

    const req = makeRequest({ studentId: "any-student-id", from: "1", to: "12", year: "2026" });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockDb.studentProfile.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [
          { id: "any-student-id" },
          {},
        ],
      },
      select: { id: true },
    });
  });
});
