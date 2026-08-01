import { test, expect } from "@playwright/test";
import path from "path";

test.describe("PDF Region Selector - Phase 2", () => {
  test("upload PDF, render page, vẽ vùng, gán câu hỏi", async ({ page }) => {
    // Login admin (có modal policy chặn)
    await page.goto("/login");
    // Chờ modal policy xuất hiện rồi accept (nếu có)
    const acceptBtn = page.locator('button:has-text("Tôi đồng ý")');
    try {
      await acceptBtn.waitFor({ state: "visible", timeout: 5000 });
      await acceptBtn.click();
      await acceptBtn.waitFor({ state: "detached", timeout: 5000 });
    } catch {
      // không có modal — tiếp tục
    }
    await page.fill('input[name="email"]', "admin@eduweb.vn");
    await page.fill('input[name="password"]', "hungcuong123");
    await page.selectOption('select[name="role"]', "admin");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin", { timeout: 15000 });

    // Mở trang admin quizzes
    await page.goto("/admin/quizzes");
    await page.locator('button:has-text("Tạo đề thi trắc nghiệm mới")').click();

    // Mở tab PDF
    await page.locator('button:has-text("PDF → Chọn vùng ảnh")').click();

    // Upload PDF mẫu
    const pdfPath = path.resolve("public/docs/sample-quiz.pdf");
    await page.setInputFiles('input[type="file"][accept="application/pdf,.pdf"]', pdfPath);

    // Chờ PDF render (canvas xuất hiện)
    await page.waitForSelector("canvas", { timeout: 15000 });
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();
    // Chờ hết loading
    await expect(page.locator("text=Đang tải PDF")).toHaveCount(0, { timeout: 15000 });

    // Verify canvas có kích thước hiển thị hợp lệ (>10px)
    const cb = (await canvas.boundingBox())!;
    expect(cb.width).toBeGreaterThan(10);
    expect(cb.height).toBeGreaterThan(10);

    // Cuộn form scroll container sao cho canvas vào giữa viewport (scrollIntoViewIfNeeded reset scroll)
    await page.evaluate(() => {
      const c = document.querySelector("canvas") as HTMLElement;
      const form = c.closest("form");
      if (!form) return;
      const canvasTopInForm = c.getBoundingClientRect().top - form.getBoundingClientRect().top + form.scrollTop;
      form.scrollTop = Math.max(0, canvasTopInForm - 40);
    });
    await page.waitForTimeout(500);

    // Vẽ vùng 1 — drag trong viewport (canvas đã được cuộn vào giữa)
    const cbAfter = (await canvas.boundingBox())!;
    const dragY = Math.max(cbAfter.y, 80) + 40;
    console.log("CANVAS BOX:", Math.round(cbAfter.x), Math.round(cbAfter.y), Math.round(cbAfter.width), Math.round(cbAfter.height), "dragY:", Math.round(dragY));
    await page.mouse.move(cbAfter.x + 80, dragY);
    await page.mouse.down();
    await page.mouse.move(cbAfter.x + 300, dragY + 60, { steps: 5 });
    await page.mouse.up();

    // Vẽ vùng 2 — drag sang phải
    const dragY2 = dragY + 90;
    await page.mouse.move(cbAfter.x + 80, dragY2);
    await page.mouse.down();
    await page.mouse.move(cbAfter.x + 250, dragY2 + 50, { steps: 5 });
    await page.mouse.up();

    // Verify 2 vùng được tạo (badge #1, #2) — dùng count vì badge ngoài viewport
    const regionCount = await page.locator('[data-region-control]').count();
    console.log("REGION COUNT:", regionCount);
    expect(regionCount).toBe(2);
    expect(await page.locator("text=#1").count()).toBe(1);
    expect(await page.locator("text=#2").count()).toBe(1);

    // Verify dropdown gán câu hỏi xuất hiện (region select có option "Gán vào câu...")
    const regionSelects = page.locator("select").filter({ has: page.locator("option", { hasText: "Gán vào câu..." }) });
    expect(await regionSelects.count()).toBeGreaterThanOrEqual(2);

    // Gán cả 2 vùng vào "Câu 1" (questions mặc định có 1 câu) — dùng JS để không cần visible
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll("select"));
      for (const s of selects) {
        const hasGan = Array.from(s.options).some((o) => o.textContent?.includes("Gán vào câu"));
        if (hasGan) s.value = "0"; // Câu 1
      }
    });
    await page.waitForTimeout(200);

    // Verify nút crop tồn tại
    await expect(page.locator('button:has-text("Crop & gắn ảnh")')).toBeVisible();
  });
});
