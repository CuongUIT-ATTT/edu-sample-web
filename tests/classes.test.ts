import { beforeEach, describe, expect, test, vi } from "vitest";
import { deleteClass } from "@/actions/classes";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { mockDb } from "./setup";

describe("Classes Server Actions Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({
      userId: "admin-1",
      email: "admin@eduweb.test",
      name: "Admin User",
      role: "ADMIN",
    } as any);
    mockDb.homeworkSubmission.deleteMany.mockResolvedValue({ count: 0 });
    mockDb.class.delete.mockResolvedValue({ id: "class-1" });
  });

  test("deletes homework submissions before deleting an authorized class", async () => {
    mockDb.homeworkSubmission.deleteMany.mockResolvedValue({ count: 2 });
    const deletionOrder: string[] = [];
    mockDb.homeworkSubmission.deleteMany.mockImplementation(async () => {
      deletionOrder.push("submissions");
      return { count: 2 };
    });
    mockDb.class.delete.mockImplementation(async () => {
      deletionOrder.push("class");
      return { id: "class-1" };
    });

    const result = await deleteClass("class-1");

    expect(result).toEqual({
      success: true,
      message: "Đã xoá lớp luyện thi và 2 bài nộp bài tập liên quan.",
    });
    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
    expect(mockDb.homeworkSubmission.deleteMany).toHaveBeenCalledWith({
      where: { series: { classId: "class-1" } },
    });
    expect(mockDb.class.delete).toHaveBeenCalledWith({ where: { id: "class-1" } });
    expect(deletionOrder).toEqual(["submissions", "class"]);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/classes");
    expect(revalidatePath).toHaveBeenCalledWith("/teacher");
  });

  test("deletes a class without homework submissions", async () => {
    const result = await deleteClass("class-1");

    expect(result).toEqual({ success: true, message: "Xoá lớp luyện thi thành công." });
    expect(mockDb.homeworkSubmission.deleteMany).toHaveBeenCalledWith({
      where: { series: { classId: "class-1" } },
    });
    expect(mockDb.class.delete).toHaveBeenCalledWith({ where: { id: "class-1" } });
  });

  test("rejects an unauthorized caller before destructive work", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const result = await deleteClass("class-1");

    expect(result).toEqual({ success: false, error: "Bạn không có quyền thực hiện thao tác này." });
    expect(mockDb.$transaction).not.toHaveBeenCalled();
    expect(mockDb.homeworkSubmission.deleteMany).not.toHaveBeenCalled();
    expect(mockDb.class.delete).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test("rejects a non-owning teacher before destructive work", async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: "teacher-user-1",
      email: "teacher@eduweb.test",
      name: "Teacher User",
      role: "TEACHER",
    } as any);
    mockDb.teacherProfile.findUnique.mockResolvedValue({ id: "teacher-profile-1" });
    mockDb.class.findFirst.mockResolvedValue(null);

    const result = await deleteClass("class-1");

    expect(result).toEqual({ success: false, error: "Bạn không được xoá lớp không phụ trách." });
    expect(mockDb.$transaction).not.toHaveBeenCalled();
    expect(mockDb.homeworkSubmission.deleteMany).not.toHaveBeenCalled();
    expect(mockDb.class.delete).not.toHaveBeenCalled();
  });

  test("returns a safe error when the transaction fails", async () => {
    mockDb.homeworkSubmission.deleteMany.mockRejectedValue(new Error("database unavailable"));

    const result = await deleteClass("class-1");

    expect(result).toEqual({ success: false, error: "Đã xảy ra lỗi hệ thống khi xoá lớp học." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
