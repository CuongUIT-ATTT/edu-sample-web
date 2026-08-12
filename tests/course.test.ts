import { describe, it, expect } from "vitest";
import { db } from "./helpers";

async function sid(email: string) {
  const u = await db.user.findUnique({ where: { email }, include: { studentProfile: true } });
  return u?.studentProfile?.id;
}

describe("Course - Modules/Lessons/Enrollment", () => {
  it("course published có 2 modules, module 1 có 2 lessons đúng order", async () => {
    const c = await db.course.findFirst({
      where: { title: { contains: "Nhập môn Đại số" } },
      include: { modules: { include: { lessons: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
    });
    expect(c).not.toBeNull();
    expect(c!.modules).toHaveLength(2);
    expect(c!.modules[0].lessons).toHaveLength(2);
    expect(c!.modules[0].lessons[0].order).toBe(1);
  });

  it("student1 và student2 đều có enrollment", async () => {
    const [id1, id2] = await Promise.all([sid("student1@eduweb.vn"), sid("student2@eduweb.vn")]);
    const [e1, e2] = await Promise.all([
      db.enrollment.findFirst({ where: { studentId: id1 } }),
      db.enrollment.findFirst({ where: { studentId: id2 } }),
    ]);
    expect(e1).not.toBeNull();
    expect(e2).not.toBeNull();
  });
});
