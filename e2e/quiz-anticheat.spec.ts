import { Page } from '@playwright/test'
import { db } from '@/lib/db'
import { test, expect } from './fixtures/auth'
import { gotoWithDisclaimerAccepted } from './helpers/auth'

test.describe('Quiz anti-cheating and scoring tests', () => {
  test.describe.configure({ mode: 'serial' })
  test.setTimeout(60000)


  let sharedQuizUrl = ''
  let sharedQuizId = ''
  const quizTitle = `QA Anti Cheat Test Quiz ${Date.now()}`

  test.beforeAll(async () => {
    const teacher = await db.teacherProfile.findFirstOrThrow({
      where: { user: { email: 'teacher.toan@eduweb.vn' } },
      select: { id: true },
    })
    const subject = await db.subject.findFirstOrThrow({ where: { code: 'MATH101' }, select: { id: true } })
    const quiz = await db.quiz.create({
      data: {
        title: quizTitle,
        description: 'Anti-cheat quiz generated directly from E2E data.',
        duration: 15,
        passingScore: 10,
        isPublic: true,
        answerVisibility: 'IMMEDIATELY',
        shuffleQuestions: false,
        teacherId: teacher.id,
        subjectId: subject.id,
        questions: {
          create: [
            {
              text: 'Đề thi Đúng Sai mẫu',
              type: 'TRUE_FALSE',
              options: ['Ý phát biểu A', 'Ý phát biểu B', 'Ý phát biểu C', 'Ý phát biểu D'],
              correctAnswer: 'T,F,T,T',
              score: 1,
              explanation: 'Giải thích chi tiết câu Đúng Sai',
            },
          ],
        },
      },
      include: { questions: true },
    })

    sharedQuizId = quiz.id
    sharedQuizUrl = `http://localhost:3000/quizzes/${quiz.id}`
  })

  async function startSharedQuiz(page: Page, guestName: string): Promise<void> {
    await gotoWithDisclaimerAccepted(page, sharedQuizUrl)

    const guestNameInput = page.locator('input[placeholder="Ví dụ: Nguyễn Văn A..."]')
    const agreementCheckbox = page.getByRole('checkbox', {
      name: 'Tôi xác nhận đã đọc kỹ nội quy phòng thi và cam kết làm bài tự lực, trung thực.',
    })
    const guestNameLabel = page.getByText('Họ Tên Thí Sinh:')
    const rulesHeading = page.getByRole('heading', { name: /Quy Chế Phòng Thi & Chống Gian Lận/ })
    const startButton = page.getByRole('button', { name: 'Vào làm bài (Tính giờ)', exact: true })
    const submitButton = page.getByRole('button', { name: 'Nộp bài thi', exact: true }).first()
    const firstTrueButton = page.getByRole('button', { name: 'Đ', exact: true }).first()
    const toast = page.locator('div.fixed.top-4.right-4 > div').last()

    await expect(page.getByRole('heading', { name: quizTitle, exact: true })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Vui lòng xem kỹ trước khi bắt đầu tính giờ làm bài.')).toBeVisible({ timeout: 10000 })
    await expect(guestNameLabel).toBeVisible({ timeout: 10000 })
    await expect(guestNameInput.first()).toBeVisible({ timeout: 10000 })
    await guestNameInput.first().fill(guestName)
    await expect(guestNameInput.first()).toHaveValue(guestName)
    await expect(rulesHeading).toBeVisible({ timeout: 10000 })
    const rulesGuestNameInput = guestNameInput.last()
    await expect(rulesGuestNameInput).toBeVisible({ timeout: 10000 })
    await expect(rulesGuestNameInput).toHaveValue(guestName)
    await agreementCheckbox.check()
    await expect(agreementCheckbox).toBeChecked({ timeout: 10000 })
    await expect(startButton).toBeVisible({ timeout: 10000 })

    await startButton.click()

    const startOutcome = await Promise.race([
      submitButton.waitFor({ state: 'visible', timeout: 30000 }).then(() => 'started' as const),
      toast.waitFor({ state: 'visible', timeout: 30000 }).then(() => 'toast' as const),
    ])

    if (startOutcome === 'toast') {
      const toastText = (await toast.innerText()).trim()
      throw new Error(`Không thể bắt đầu làm bài: ${toastText}`)
    }

    await expect(submitButton).toBeVisible({ timeout: 10000 })
    await expect(firstTrueButton).toBeVisible({ timeout: 10000 })
  }

  async function runQuizScoringTest(page: Page, guestName: string, answersToClick: ('Đ' | 'S')[]): Promise<void> {
    await startSharedQuiz(page, guestName)

    const questionCard = page.locator('.bg-canvas', { hasText: 'Đề thi Đúng Sai mẫu' }).first()
    const questionRows = questionCard.locator('.grid.grid-cols-12.items-center.gap-2.py-1.text-xs.border-b')

    await expect(questionCard).toBeVisible({ timeout: 10000 })
    await expect(questionRows).toHaveCount(4)

    for (const [index, choice] of answersToClick.entries()) {
      const row = questionRows.nth(index)
      const optionButton = row.getByRole('button', { name: choice, exact: true })
      await expect(optionButton).toBeVisible()
      await optionButton.evaluate((el: HTMLButtonElement) => el.click())
      await expect(optionButton).toBeVisible()
    }

    await page.locator('button:has-text("Nộp bài thi")').first().click()
    await expect(page.getByRole('heading', { name: /Kết quả của/i })).toBeVisible({ timeout: 15000 })

    await page.locator('button:has-text("Xem đáp án & lời giải chi tiết")').click()
    await expect(page.getByRole('heading', { name: 'Chi tiết đáp án & lời giải đề thi' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: 'Quay lại bảng điểm' })).toBeVisible({ timeout: 15000 })
  }

  test('3A-1: Score for 1/4 correct options is 0.10đ', async ({ page }) => {
    await runQuizScoringTest(page, 'Guest One', ['Đ', 'Đ', 'S', 'S'])

    const badge = page.locator('span:has-text("Đúng một phần")')
    await expect(badge).toContainText('1/4 ý')
    await expect(badge).toContainText('0.10đ')
  })

  test('3A-2: Score for 2/4 correct options is 0.25đ', async ({ page }) => {
    await runQuizScoringTest(page, 'Guest Two', ['Đ', 'S', 'S', 'S'])

    const badge = page.locator('span:has-text("Đúng một phần")')
    await expect(badge).toContainText('2/4 ý')
    await expect(badge).toContainText('0.25đ')
  })

  test('3A-3: Score for 3/4 correct options is 0.50đ', async ({ page }) => {
    await runQuizScoringTest(page, 'Guest Three', ['Đ', 'S', 'Đ', 'S'])

    const badge = page.locator('span:has-text("Đúng một phần")')
    await expect(badge).toContainText('3/4 ý')
    await expect(badge).toContainText('0.50đ')
  })

  test('3A-4: Score for 4/4 correct options is 1.00đ', async ({ page }) => {
    await runQuizScoringTest(page, 'Guest Four', ['Đ', 'S', 'Đ', 'Đ'])

    const badge = page.locator('span:has-text("Đúng (")')
    await expect(badge).toContainText('1.00đ')
  })

  test('3B-1: Focus and tab switch detection locks the test on 3rd violation', async ({ page }) => {
    await startSharedQuiz(page, 'Security Check Student')
    await expect(page.locator('button:has-text("Nộp bài thi")')).toBeVisible()
    await page.waitForTimeout(300)

    await page.evaluate(() => {
      window.dispatchEvent(new FocusEvent('blur'))
    })
    await page.waitForTimeout(2200)

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      })
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await page.waitForTimeout(2200)

    await page.evaluate(() => {
      window.dispatchEvent(new FocusEvent('blur'))
    })

    await expect(page.locator('h3:has-text("Bài thi đã bị khóa")')).toBeVisible({ timeout: 10000 })
  })

  test('3B-2: Right-click context menu is blocked', async ({ page }) => {
    await startSharedQuiz(page, 'Guest Test')

    const contextMenuFired = await page.evaluate(() => {
      let fired = false
      const listener = (event: MouseEvent) => {
        fired = !event.defaultPrevented
      }
      document.addEventListener('contextmenu', listener)
      const target = document.querySelector('h3') || document.body
      target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
      document.removeEventListener('contextmenu', listener)
      return fired
    })

    expect(contextMenuFired).toBe(false)
  })

  test('3B-3: Text selection is disabled', async ({ page }) => {
    await startSharedQuiz(page, 'Guest Test')

    const selectable = await page.evaluate(() => {
      const element = document.querySelector('.select-none[style*="user-select"]')
      return element?.getAttribute('style') ?? ''
    })

    expect(selectable).toContain('user-select: none')
  })

  test('3B-4: Security watermark exists and contains student name', async ({ page }) => {
    const studentName = 'Watermark Candidate 007'
    await startSharedQuiz(page, studentName)

    const watermarkText = await page.locator('.pointer-events-none.fixed').first().innerText()
    expect(watermarkText).toContain(studentName)
    expect(watermarkText).toContain('CẤM QUAY MÀN HÌNH')
  })

  test('3B-5: Unlisted quiz does not appear in public listing but is accessible directly', async ({ page }) => {
    await gotoWithDisclaimerAccepted(page, '/quizzes')
    const quizLink = page.locator(`a[href*="${sharedQuizId}"]`)
    await expect(quizLink).not.toBeVisible()

    await gotoWithDisclaimerAccepted(page, sharedQuizUrl)
    await expect(page.getByRole('heading', { name: quizTitle, exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Quy Chế Phòng Thi & Chống Gian Lận/ })).toBeVisible()
    await expect(page.locator('input[placeholder="Ví dụ: Nguyễn Văn A..."]')).toBeVisible()
    await expect(page.getByRole('checkbox')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Vào làm bài (Tính giờ)', exact: true })).toBeVisible()
  })

  test.afterAll(async () => {
    await db.quiz.deleteMany({ where: { title: quizTitle } })
  })
})
