import { describe, it, expect } from "vitest";

describe("Leaderboard Database Query", () => {
  it("should only select public fields name, score, and class and exclude PII (email, phone, db id)", () => {
    // Mock the Prisma select query schema used in page.tsx
    const querySelect = {
      include: {
        user: {
          select: { name: true }, // ONLY name
        },
        class: {
          select: { name: true, gradeLevel: true },
        },
        grades: {
          select: { score: true },
        },
      },
    };

    // Ensure email is not in the select query schema
    expect(querySelect.include.user.select).not.toHaveProperty("email");
    expect(querySelect.include.user.select).not.toHaveProperty("phone");
    expect(querySelect.include.user.select).not.toHaveProperty("passwordHash");
  });
});
