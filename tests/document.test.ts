import { describe, it, expect } from "vitest";
import { db } from "./helpers";

describe("Document - Visibility", () => {
  it("doc-001 public (không classVisibility)", async () => {
    const d = await db.document.findUnique({ where: { id: "doc-001" }, include: { classVisibility: true } });
    expect(d!.classVisibility).toHaveLength(0);
  });

  it("doc-002 chỉ visible cho 1 lớp duy nhất", async () => {
    const d = await db.document.findUnique({ where: { id: "doc-002" }, include: { classVisibility: true } });
    expect(d!.classVisibility).toHaveLength(1);
  });

  it("doc-003 là draft (published=false)", async () => {
    const d = await db.document.findUnique({ where: { id: "doc-003" } });
    expect(d!.published).toBe(false);
  });
});
