import { test, expect } from "@playwright/test";

async function loginAs(page: any, email: string) {
  await page.goto("/login");
  await page.fill("input[name='email']", email);
  await page.fill("input[name='password']", "hungcuong123");
  await page.click("button[type='submit']");
  // Wait for redirect to complete
  await page.waitForURL("**/dashboard", { timeout: 10000 }).catch(() => {});
}

test("teacher dashboard shows class stats widget", async ({ page }) => {
  // Use mock page interaction to verify content or test on production URL
  await loginAs(page, "giangvien@eduweb.vn");
  
  // Verify stats are visible
  await expect(page.locator("h4:has-text('Thống kê Học viên Giỏi')")).toBeVisible();
  await expect(page.locator("h4:has-text('Cảnh báo Học lực Yếu')")).toBeVisible();
});

test("parent dashboard shows child countdown", async ({ page }) => {
  await loginAs(page, "phuhuynh@eduweb.vn");
  
  // Verify countdown card is visible on parent portal
  await expect(page.locator("h4:has-text('Kỳ thi Tốt nghiệp THPT 2027')")).toBeVisible();
  await expect(page.locator("strong:has-text('Thần Phản Ứng Luyện Thi')")).toBeVisible();
});
