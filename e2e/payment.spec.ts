import { test, expect } from "./fixtures/auth";

test.describe("Student payment page (Học phí)", () => {
  test("student payment page renders tuition section", async ({ studentPage }) => {
    await studentPage.goto("/student/payment");
    // Tiêu đề trang
    await expect(
      studentPage.locator("h1:has-text('Học phí')").first()
    ).toBeVisible();
  });

  test("student payment nav item is present in sidebar", async ({ studentPage }) => {
    await studentPage.goto("/student");
    const nav = studentPage.locator("nav");
    await expect(nav.locator("a:has-text('Học phí')").first()).toBeVisible();
  });
});
