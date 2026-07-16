import { test, expect } from './fixtures/auth'
import { Page } from '@playwright/test'

test.describe('Quiz anti-cheating and scoring tests', () => {
  test.describe.configure({ mode: 'serial' })
  let sharedQuizUrl = ''
  let sharedQuizId = ''

  // 1. Setup phase: Teacher creates the quiz with 1 True/False question
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: 'e2e/.auth/teacher.json' })
    const page = await ctx.newPage()
    
    // Persistent clipboard mock surviving reloads
    await page.exposeFunction('mockClipboardWrite', (text: string) => {
      sharedQuizUrl = text
      const parts = text.split('/')
      sharedQuizId = parts[parts.length - 1]
    })
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async (text: string) => {
            (window as any).mockClipboardWrite(text)
            return Promise.resolve()
          }
        },
        configurable: true
      })
    })

    await page.goto('/teacher/quizzes')

    // Click "Tạo đề thi trắc nghiệm mới"
    await page.locator('button:has-text("Tạo đề thi trắc nghiệm mới")').click()

    // Fill Title
    const quizTitle = 'QA Anti Cheat Test Quiz'
    await page.locator('input[placeholder="Kiểm tra Giữa kỳ II - Toán 12"]').fill(quizTitle)

    // Select Subject (index 1)
    await page.locator('select').first().selectOption({ index: 1 })

    // Check "Công khai đề thi (Public)"
    const publicCheckbox = page.locator('#isPublic')
    await publicCheckbox.check()

    // Uncheck "Hiển thị trên danh sách làm đề thi thử" to make it UNLISTED
    const listCheckbox = page.locator('#showOnList')
    if (await listCheckbox.isChecked()) {
      await listCheckbox.uncheck()
    }

    // Select Answer visibility immediately
    await page.locator('select').nth(2).selectOption('IMMEDIATELY')

    // Fill duration and passing score
    await page.locator('input[type="number"]').first().fill('15')
    await page.locator('input[type="number"]').nth(1).fill('1')

    // Toggle "Dán JSON" import tab
    await page.locator('button:has-text("Dán JSON")').click()

    // Input questions JSON
    const questionsJson = [
      {
        questionText: 'Đề thi Đúng Sai mẫu',
        type: 'TRUE_FALSE',
        options: ['Ý phát biểu A', 'Ý phát biểu B', 'Ý phát biểu C', 'Ý phát biểu D'],
        correctAnswer: 'T,F,T,T',
        score: 1.0,
        explanation: 'Giải thích chi tiết câu Đúng Sai'
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

    // Click "Chia sẻ" to copy the URL
    page.on('dialog', async dialog => {
      try {
        await dialog.accept()
      } catch (err) {}
    })
    await quizCard.locator('button:has-text("Chia sẻ")').click()
    expect(sharedQuizUrl).toContain('/quizzes/')

    await page.close()
    await ctx.close()
  })

  // Helper to complete the quiz for scoring verification
  async function runQuizScoringTest(page: Page, guestName: string, answersToClick: ('Đ' | 'S')[]) {
    await page.goto(sharedQuizUrl)

    // Fill guest name modal
    await page.locator('input[placeholder="Ví dụ: Nguyễn Văn A..."]').fill(guestName)
    await page.locator('.shadow-product button:has-text("Bắt đầu làm bài")').click()

    // Click on designated buttons: Row 0, Row 1, Row 2, Row 3
    const rows = page.locator('.grid-cols-12:has(button)')
    for (let i = 0; i < answersToClick.length; i++) {
      const choice = answersToClick[i]
      const row = rows.nth(i)
      await row.locator(`button:has-text("${choice}")`).click()
    }

    // Submit the quiz
    await page.locator('button:has-text("Nộp bài thi")').click()
    await page.locator('button:has-text("Xem đáp án & lời giải chi tiết")').click()
  }

  // 3A. Tính điểm Đúng/Sai (True/False scoring)
  test('3A-1: Score for 1/4 correct options is 0.10đ', async ({ page }) => {
    // Correct: T,F,T,T. We answer: T,T,F,F -> click: Đ, Đ, S, S (Only 1st is correct)
    await runQuizScoringTest(page, 'Guest One', ['Đ', 'Đ', 'S', 'S'])
    
    // Verify badge displays "Đúng một phần (1/4 ý) (0.10đ)"
    const badge = page.locator('span:has-text("Đúng một phần")')
    await expect(badge).toContainText('1/4 ý')
    await expect(badge).toContainText('0.10đ')
  })

  test('3A-2: Score for 2/4 correct options is 0.25đ', async ({ page }) => {
    // Correct: T,F,T,T. We answer: T,F,F,F -> click: Đ, S, S, S (1st, 2nd correct)
    await runQuizScoringTest(page, 'Guest Two', ['Đ', 'S', 'S', 'S'])

    const badge = page.locator('span:has-text("Đúng một phần")')
    await expect(badge).toContainText('2/4 ý')
    await expect(badge).toContainText('0.25đ')
  })

  test('3A-3: Score for 3/4 correct options is 0.50đ', async ({ page }) => {
    // Correct: T,F,T,T. We answer: T,F,T,F -> click: Đ, S, Đ, S (1st, 2nd, 3rd correct)
    await runQuizScoringTest(page, 'Guest Three', ['Đ', 'S', 'Đ', 'S'])

    const badge = page.locator('span:has-text("Đúng một phần")')
    await expect(badge).toContainText('3/4 ý')
    await expect(badge).toContainText('0.50đ')
  })

  test('3A-4: Score for 4/4 correct options is 1.00đ', async ({ page }) => {
    // Correct: T,F,T,T. We answer: T,F,T,T -> click: Đ, S, Đ, Đ (all correct)
    await runQuizScoringTest(page, 'Guest Four', ['Đ', 'S', 'Đ', 'Đ'])

    const badge = page.locator('span:has-text("Đúng (")')
    await expect(badge).toContainText('1.00đ')
  })

  // 3B. Anti-Cheat Mechanisms
  test('3B-1: Focus and tab switch detection locks the test on 3rd violation', async ({ page }) => {
    await page.goto(sharedQuizUrl)
    
    // Start Quiz
    await page.locator('input[placeholder="Ví dụ: Nguyễn Văn A..."]').fill('Security Check Student')
    await page.locator('.shadow-product button:has-text("Bắt đầu làm bài")').click()

    // Trigger tab switch 1
    const dialog1Promise = page.waitForEvent('dialog')
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    const dialog1 = await dialog1Promise
    expect(dialog1.message()).toContain('Lần vi phạm: 1/3')
    await dialog1.accept()

    // Wait for the 2000ms debounce limit in triggerWarning
    await page.waitForTimeout(2200)

    // Trigger tab switch 2
    const dialog2Promise = page.waitForEvent('dialog')
    await page.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    const dialog2 = await dialog2Promise
    expect(dialog2.message()).toContain('Lần vi phạm: 2/3')
    await dialog2.accept()

    await page.waitForTimeout(2200)

    // Trigger tab switch 3 -> locks test and auto submits
    const dialog3Promise = page.waitForEvent('dialog')
    await page.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    const dialog3 = await dialog3Promise
    expect(dialog3.message()).toContain('BÀI THI BỊ KHÓA')
    await dialog3.accept()

    // Verify lock screen overlay is visible
    // TODO: add data-testid="lockscreen-overlay" to lock container
    const lockScreen = page.locator('h3:has-text("Bài thi đã bị khóa")')
    await expect(lockScreen).toBeVisible()

    // Verify answer buttons are covered/blocked by the lock screen overlay and clicking has no effect
    const optBtn = page.locator('button:has-text("Đ")').first()
    await optBtn.click({ force: true })
    await expect(optBtn).not.toHaveClass(/bg-green-600/)
  })

  test('3B-2: Right-click context menu is blocked', async ({ page }) => {
    await page.goto(sharedQuizUrl)
    await page.locator('input[placeholder="Ví dụ: Nguyễn Văn A..."]').fill('Guest Test')
    await page.locator('.shadow-product button:has-text("Bắt đầu làm bài")').click()

    const contextMenuFired = await page.evaluate(() => {
      let fired = false
      const listener = (e: MouseEvent) => {
        fired = !e.defaultPrevented
      }
      document.addEventListener('contextmenu', listener)
      // Dispatch on a child element inside the player so it bubbles through the container React handler
      const target = document.querySelector('h3') || document.body
      target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
      document.removeEventListener('contextmenu', listener)
      return fired
    })
    expect(contextMenuFired).toBe(false)
  })

  test('3B-3: Text selection is disabled', async ({ page }) => {
    await page.goto(sharedQuizUrl)
    await page.locator('input[placeholder="Ví dụ: Nguyễn Văn A..."]').fill('Guest Test')
    await page.locator('.shadow-product button:has-text("Bắt đầu làm bài")').click()

    const selectable = await page.evaluate(() => {
      const el = document.querySelector('.select-none') || document.body
      const style = window.getComputedStyle(el)
      return style.userSelect
    })
    // select-none class results in 'none'
    expect(selectable).toBe('none')
  })

  test('3B-4: Security watermark exists and contains student name', async ({ page }) => {
    const studentName = 'Watermark Candidate 007'
    await page.goto(sharedQuizUrl)
    await page.locator('input[placeholder="Ví dụ: Nguyễn Văn A..."]').fill(studentName)
    await page.locator('.shadow-product button:has-text("Bắt đầu làm bài")').click()

    // Verify watermark element exists
    // TODO: add data-testid="security-watermark" to watermark container
    const watermarkText = await page.locator('.pointer-events-none.fixed').first().innerText()
    expect(watermarkText).toContain(studentName)
    expect(watermarkText).toContain('CẤM QUAY MÀN HÌNH')
  })

  test('3B-5: Unlisted quiz does not appear in public listing but is accessible directly', async ({ page }) => {
    // 1. Verify not visible on /quizzes feed list
    await page.goto('/quizzes')
    const quizLink = page.locator(`a[href*="${sharedQuizId}"]`)
    await expect(quizLink).not.toBeVisible()

    // 2. Direct link loads successfully
    await page.goto(sharedQuizUrl)
    const titleText = page.locator('h3:has-text("Nhập Họ Tên Thí Sinh")')
    await expect(titleText).toBeVisible()
  })

  // 4. Teardown phase: Teacher logs in and deletes the created quiz to clean database
  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: 'e2e/.auth/teacher.json' })
    const page = await ctx.newPage()
    await page.goto('/teacher/quizzes')
    await page.waitForLoadState('load')

    // Delete all duplicate test quizzes to ensure database cleanup
    let quizCard = page.locator('.shadow-sm', { has: page.locator('h3', { hasText: 'QA Anti Cheat Test Quiz' }) }).first()
    while (await quizCard.isVisible()) {
      page.on('dialog', async dialog => {
        try {
          await dialog.accept()
        } catch (err) {}
      })
      await quizCard.locator('button:has-text("Xoá")').click()
      await page.waitForTimeout(2000)
      quizCard = page.locator('.shadow-sm', { has: page.locator('h3', { hasText: 'QA Anti Cheat Test Quiz' }) }).first()
    }

    await page.close()
    await ctx.close()
  })
})
