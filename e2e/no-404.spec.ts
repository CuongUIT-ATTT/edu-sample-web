import { test, expect } from "@playwright/test";

test("footer links return 200", async ({ page }) => {
  const links = [
    "/about", 
    "/contact", 
    "/privacy", 
    "/terms",
    "/admission/fees", 
    "/quizzes", 
    "/leaderboard",
    "/documents", 
    "/learning-paths"
  ];
  
  for (const path of links) {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
  }
});
