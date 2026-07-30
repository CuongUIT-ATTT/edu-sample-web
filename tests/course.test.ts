import { describe, it, expect } from "vitest";
import { db } from "./helpers";

async function sid(email: string) {
  const u = await db.user.findUnique({ where: { email }, include: { studentProfile: true } });
  return u?.studentProfile?.id;
}

describe("Course - Modules/Lessons/Enrollment", () => {
  it("course có 2 modules mỗi module 2 lessons đúng order", async () => {
    const c = await db.course.findFirst({
      where: { title: { contains: "Luyện thi" } },
      include: { modules: { include: { lessons: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
    });
    expect(c).not.toBeNull();
    expect(c!.modules).toHaveLength(2);
    expect(c!.modules[0].lessons).toHaveLength(2);
    expect(c!.modules[0].lessons[0].order).toBe(1);
  });

  it("hs001 và hs002 đều có enrollment", async () => {
    const [id1, id2] = await Promise.all([sid("hs001@email.com"), sid("hs002@email.com")]);
    const [e1, e2] = await Promise.all([
      db.enrollment.findFirst({ where: { studentId: id1 } }),
      db.enrollment.findFirst({ where: { studentId: id2 } }),
    ]);
    expect(e1).not.toBeNull();
    expect(e2).not.toBeNull();
  });
});
