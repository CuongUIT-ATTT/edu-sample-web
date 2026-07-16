import { test, expect } from "@playwright/test";

test.describe("Quiz Demo Tests", () => {
  test.describe.configure({ mode: 'serial' })

  // 1. Setup phase: Teacher creates the public math quiz
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: 'e2e/.auth/teacher.json' })
    const page = await ctx.newPage()
    await page.goto('/teacher/quizzes')

    // Click "Tạo đề thi trắc nghiệm mới"
    await page.locator('button:has-text("Tạo đề thi trắc nghiệm mới")').click()

    // Fill Title
    const quizTitle = 'Khảo sát đầu năm môn Toán Lớp 10'
    await page.locator('input[placeholder="Kiểm tra Giữa kỳ II - Toán 12"]').fill(quizTitle)

    // Select Subject (index 1)
    await page.locator('select').first().selectOption({ index: 1 })

    // Check "Công khai đề thi (Public)"
    const publicCheckbox = page.locator('#isPublic')
    await publicCheckbox.check()

    // Toggle "Dán JSON" import tab
    await page.locator('button:has-text("Dán JSON")').click()

    // Input questions JSON
    const questionsJson = [
      {
        questionText: 'Giải phương trình x^2 - 5x + 6 = 0.',
        type: 'MULTIPLE_CHOICE',
        options: ['x = {2, 3}', 'x = {1, 6}', 'x = {-2, -3}', 'x = {0, 5}'],
        correctAnswer: '0',
        score: 5.0,
        explanation: 'Giải thích câu 1'
      },
      {
        questionText: 'Cho hệ thức Vi-ét của phương trình x^2 + px + q = 0.',
        type: 'MULTIPLE_CHOICE',
        options: ['p', '-p', 'q', '-q'],
        correctAnswer: '1',
        score: 5.0,
        explanation: 'Giải thích câu 2'
      }
    ]
    await page.locator('textarea[placeholder*="JSON"]').fill(JSON.stringify(questionsJson))

    // Click "Import từ JSON"
    page.on('dialog', async dialog => {
      await dialog.accept()
    })
    await page.locator('button:has-text("Import từ JSON")').click()

    // Click "Xác nhận tạo đề thi" and wait for reload
    await page.locator('button:has-text("Xác nhận tạo đề thi")').click()
    await page.waitForLoadState('domcontentloaded')

    // Wait for quiz card to be visible in the list to avoid race conditions
    const quizCard = page.locator('.shadow-sm', { has: page.locator('h3', { hasText: quizTitle }) }).first()
    await expect(quizCard).toBeVisible()

    await page.close()
    await ctx.close()
  })

  // 2. Main E2E flow: Guest completes public math quiz
  test("guest can complete demo quiz without login", async ({ page }) => {
    await page.goto("/quizzes");
    
    // Find the demo quiz card and start it
    const quizCard = page.locator('.shadow-sm', { has: page.locator('h3', { hasText: 'Khảo sát đầu năm môn Toán Lớp 10' }) }).first();
    await expect(quizCard).toBeVisible();
    await quizCard.locator('button:has-text("Bắt đầu thi thử")').click();

    // Enter guest name
    await page.locator('input[placeholder="Ví dụ: Nguyễn Văn A..."]').fill('Guest Candidate');
    await page.locator('.shadow-product button:has-text("Bắt đầu làm bài")').click();

    // Answer Question 1 (Select option A)
    const q1 = page.locator('.bg-canvas', { hasText: 'Câu 1:' }).first();
    await expect(q1).toBeVisible();
    await q1.locator('button:has-text("A")').first().click();

    // Answer Question 2 (Select option B)
    const q2 = page.locator('.bg-canvas', { hasText: 'Câu 2:' }).first();
    await expect(q2).toBeVisible();
    await q2.locator('button:has-text("B")').first().click();

    // Submit the quiz
    const submitBtn = page.locator('button:has-text("Nộp bài thi tự do")');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify results screen
    await expect(page.locator("h2:has-text('Kết quả của Guest Candidate')")).toBeVisible();
    
    // Click review answers
    const reviewBtn = page.locator('button:has-text("Xem đáp án & lời giải chi tiết")');
    await expect(reviewBtn).toBeVisible();
    await reviewBtn.click();

    // Verify solutions screen
    await expect(page.locator("h3:has-text('Chi tiết đáp án & lời giải đề thi')")).toBeVisible();
  });

  // 3. Teardown phase: Teacher deletes the created quiz to keep DB clean
  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: 'e2e/.auth/teacher.json' })
    const page = await ctx.newPage()
    await page.goto('/teacher/quizzes')
    await page.waitForLoadState('load')

    // Delete all duplicate test quizzes to ensure database cleanup
    let quizCard = page.locator('.shadow-sm', { has: page.locator('h3', { hasText: 'Khảo sát đầu năm môn Toán Lớp 10' }) }).first()
    while (await quizCard.isVisible()) {
      page.on('dialog', async dialog => {
        try {
          await dialog.accept()
        } catch (err) {}
      })
      await quizCard.locator('button:has-text("Xoá")').click()
      await page.waitForTimeout(2000)
      quizCard = page.locator('.shadow-sm', { has: page.locator('h3', { hasText: 'Khảo sát đầu năm môn Toán Lớp 10' }) }).first()
    }

    await page.close()
    await ctx.close()
  })
})
