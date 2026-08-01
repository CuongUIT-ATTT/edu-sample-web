import { test, expect } from "@playwright/test";

test.describe("Quiz deadline + answer visibility", () => {
  // Helper: login admin và accept modal policy
  async function loginAdmin(page: any) {
    await page.goto("/login");
    const accept = page.locator('button:has-text("Tôi đồng ý")');
    try {
      await accept.waitFor({ state: "visible", timeout: 4000 });
      await accept.click();
      await accept.waitFor({ state: "detached", timeout: 4000 });
    } catch { /* no modal */ }
    await page.fill('input[name="email"]', "admin@eduweb.vn");
    await page.fill('input[name="password"]', "hungcuong123");
    await page.selectOption('select[name="role"]', "admin");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin", { timeout: 15000 });
  }

  test("UI gating: AFTER_ALL_SUBMITTED disabled khi public hoặc chưa chọn lớp", async ({ page }) => {
    await loginAdmin(page);
    await page.goto("/admin/quizzes");
    await page.locator('button:has-text("Tạo đề thi trắc nghiệm mới")').click();

    // Dropdown answerVisibility (select thứ 3: subjects=0, class=1, answerVisibility=2)
    const visSelect = page.locator("select").nth(2);
    await visSelect.waitFor({ state: "visible" });
    const option = visSelect.locator('option[value="AFTER_ALL_SUBMITTED"]');

    // Chưa chọn lớp + chưa public → disabled (vì !classId)
    await expect(option).toBeDisabled();

    // Chọn 1 lớp → enabled
    await page.locator("select").nth(1).selectOption({ index: 1 });
    await expect(option).toBeEnabled();

    // Bật public → disabled lại + tự hạ cấp
    await page.locator("#isPublic").check();
    await expect(option).toBeDisabled();
    await expect(visSelect).toHaveValue("IMMEDIATELY");
  });

  test("Deadline quá khứ → học sinh thấy badge Nộp muộn sau khi nộp", async ({ page }) => {
    // Vào trang public quizzes
    await page.goto("/quizzes");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(800);

    // Accept modal policy "Tôi đồng ý"
    const policyAccept = page.locator('button:has-text("Tôi đồng ý")');
    if (await policyAccept.count() > 0) {
      await policyAccept.first().click();
      await page.waitForTimeout(500);
    }

    // Quiz đã seed "Test deadline muộn" — bấm "Bắt đầu thi thử"
    await page.locator('button:has-text("Bắt đầu thi thử")').first().waitFor({ state: "visible", timeout: 10000 });
    await page.locator('button:has-text("Bắt đầu thi thử")').first().click();
    await page.waitForTimeout(600);

    // Màn giới thiệu → nhập tên (nếu guest) → bấm "Tiếp tục"
    const nameInput = page.locator('input[placeholder*="Ví dụ"]');
    if (await nameInput.count() > 0) await nameInput.fill("Nguyen Van Test");
    const continueBtn = page.locator('button:has-text("Tiếp tục")').first();
    if (await continueBtn.count() > 0) await continueBtn.click();
    await page.waitForTimeout(500);

    // Màn quy chế → check cam kết → "Vào làm bài"
    const agreeBox = page.locator('input[type="checkbox"]');
    if (await agreeBox.count() > 0) await agreeBox.last().check();
    const enterBtn = page.locator('button:has-text("Vào làm bài")').first();
    if (await enterBtn.count() > 0) await enterBtn.click();
    await page.waitForTimeout(800);

    // Chọn đáp án câu 1 (option "2")
    await page.locator('button:has-text("2")').first().click();
    await page.locator('button:has-text("Nộp bài thi")').first().click();
    await page.waitForTimeout(2500);

    // Verify badge Nộp muộn trên màn kết quả (desktop + mobile → dùng first)
    await expect(page.locator("text=Nộp muộn").first()).toBeVisible({ timeout: 10000 });
  });
});
