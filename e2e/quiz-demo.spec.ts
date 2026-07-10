import { test, expect } from "@playwright/test";

test("guest can complete demo quiz without login", async ({ page }) => {
  await page.goto("/quizzes");
  
  // Look for the Luyen de Demo nhanh tab or button to start
  const demoButton = page.locator("button:has-text('Luyện đề Demo nhanh')");
  await expect(demoButton).toBeVisible();
  await demoButton.click();

  const startButton = page.locator("button:has-text('Bắt đầu làm bài Demo')");
  await expect(startButton).toBeVisible();
  await startButton.click();

  // Answer questions: Select Option A (first option button) for each question
  // Loop three times for the demo questions
  for (let i = 0; i < 3; i++) {
    const firstOption = page.locator("button:has-text('A.')");
    await expect(firstOption).toBeVisible();
    await firstOption.click();

    if (i < 2) {
      const nextButton = page.locator("button:has-text('Câu tiếp theo')");
      await expect(nextButton).toBeVisible();
      await nextButton.click();
    } else {
      const submitButton = page.locator("button:has-text('Nộp bài ngay')");
      await expect(submitButton).toBeVisible();
      await submitButton.click();
    }
  }

  // Verify results screen
  await expect(page.locator("h3:has-text('Hoàn thành bài thi thử Demo!')")).toBeVisible();
  await expect(page.locator("a:has-text('Đăng ký học khóa VIP để làm full đề')")).toBeVisible();
});
