import { describe, it, expect } from "vitest";
import { db } from "./helpers";

describe("Document - Visibility", () => {
  it("doc 'Đề cương' published và giới hạn theo lớp (classVisibility)", async () => {
    const d = await db.document.findFirst({
      where: { title: { contains: "Đề cương" } },
      include: { classVisibility: true },
    });
    expect(d).not.toBeNull();
    expect(d!.published).toBe(true);
    expect(d!.classVisibility.length).toBeGreaterThanOrEqual(1);
  });

  it("doc 'Giáo án Hóa 12' là draft (published=false)", async () => {
    const d = await db.document.findFirst({ where: { title: { contains: "Giáo án Hóa 12" } } });
    expect(d).not.toBeNull();
    expect(d!.published).toBe(false);
  });

  it("doc hệ thống 'Nội quy' có createdById=null (admin đăng)", async () => {
    const d = await db.document.findFirst({ where: { title: { contains: "Nội quy" } } });
    expect(d).not.toBeNull();
    expect(d!.createdById).toBeNull();
  });
});
