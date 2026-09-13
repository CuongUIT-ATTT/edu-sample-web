import { Page, test, expect } from '@playwright/test'
import { db } from '@/lib/db'
import { gotoWithDisclaimerAccepted } from './helpers/auth'

test.describe("Quiz Demo Tests", () => {
  test.describe.configure({ mode: 'serial' })
  test.setTimeout(90000)

  let sharedQuizUrl = ''
  const quizTitle = `Khảo sát đầu năm môn Toán Lớp 10 ${Date.now()}`

  async function startSharedQuiz(page: Page, guestName: string): Promise<void> {
    await gotoWithDisclaimerAccepted(page, sharedQuizUrl)

    const guestNameInput = page.locator('input[placeholder="Ví dụ: Nguyễn Văn A..."]')
    const rulesHeading = page.getByRole('heading', { name: /quy chế phòng thi/i })
    const agreementCheckbox = page.getByRole('checkbox', {
      name: 'Tôi xác nhận đã đọc kỹ nội quy phòng thi và cam kết làm bài tự lực, trung thực.',
    })
    const startButton = page.getByRole('button', { name: 'Vào làm bài (Tính giờ)', exact: true })
    const submitButton = page.getByRole('button', { name: 'Nộp bài thi', exact: true }).first()
    const firstAnswerButton = page.getByRole('button', { name: 'A', exact: true }).first()
    const toast = page.locator('div.fixed.top-4.right-4 > div').last()

    await expect(guestNameInput.first()).toBeVisible({ timeout: 10000 })
    await guestNameInput.first().fill(guestName)
    await expect(guestNameInput.first()).toHaveValue(guestName)
    await expect(rulesHeading).toBeVisible({ timeout: 10000 })
    const rulesGuestNameInput = guestNameInput.last()
    await expect(rulesGuestNameInput).toBeVisible({ timeout: 10000 })
    await expect(rulesGuestNameInput).toHaveValue(guestName)
    await agreementCheckbox.check()
    await expect(agreementCheckbox).toBeChecked()

    await startButton.click()

    const startOutcome = await Promise.race([
      submitButton.waitFor({ state: 'visible', timeout: 10000 }).then(() => 'started' as const),
      toast.waitFor({ state: 'visible', timeout: 10000 }).then(() => 'toast' as const),
    ])

    if (startOutcome === 'toast') {
      const toastText = (await toast.innerText()).trim()
      throw new Error(`Không thể bắt đầu làm bài: ${toastText}`)
    }

    await expect(submitButton).toBeVisible({ timeout: 10000 })
    await expect(firstAnswerButton).toBeVisible({ timeout: 10000 })
  }

  async function ensureSharedQuiz(): Promise<void> {
    if (sharedQuizUrl) {
      return
    }

    const teacher = await db.teacherProfile.findFirstOrThrow({
      where: { user: { email: 'teacher.toan@eduweb.vn' } },
      select: { id: true },
    })
    const subject = await db.subject.findFirstOrThrow({ where: { code: 'MATH101' }, select: { id: true } })
    const quiz = await db.quiz.create({
      data: {
        title: quizTitle,
        description: 'Demo quiz generated directly from E2E data.',
        duration: 20,
        passingScore: 10,
        isPublic: true,
        answerVisibility: 'IMMEDIATELY',
        shuffleQuestions: false,
        teacherId: teacher.id,
        subjectId: subject.id,
        questions: {
          create: [
            {
              text: 'Giải phương trình x^2 - 5x + 6 = 0.',
              type: 'MULTIPLE_CHOICE',
              options: ['x = {2, 3}', 'x = {1, 6}', 'x = {-2, -3}', 'x = {0, 5}'],
              correctAnswer: '0',
              score: 5.0,
              explanation: 'Giải thích câu 1',
            },
            {
              text: 'Cho hệ thức Vi-ét của phương trình x^2 + px + q = 0.',
              type: 'MULTIPLE_CHOICE',
              options: ['p', '-p', 'q', '-q'],
              correctAnswer: '1',
              score: 5.0,
              explanation: 'Giải thích câu 2',
            },
          ],
        },
      },
      include: { questions: true },
    })

    sharedQuizUrl = `http://localhost:3000/quizzes/${quiz.id}`
  }

  test("guest can complete demo quiz without login", async ({ page }) => {
    await ensureSharedQuiz()
    await startSharedQuiz(page, 'Guest Candidate')

    const q1 = page.locator('.bg-canvas', { hasText: 'Câu 1:' }).first()
    await expect(q1).toBeVisible()
    await q1.getByRole('button', { name: 'A', exact: true }).click()

    const q2 = page.locator('.bg-canvas', { hasText: 'Câu 2:' }).first()
    await expect(q2).toBeVisible()
    await q2.getByRole('button', { name: 'B', exact: true }).click()

    const submitBtn = page.getByRole('button', { name: 'Nộp bài thi', exact: true }).first()
    const resultHeading = page.getByRole('heading', { name: /Kết quả của Guest Candidate/i })
    const reviewBtn = page.getByRole('button', { name: 'Xem đáp án & lời giải chi tiết', exact: true })
    const toast = page.locator('div.fixed.top-4.right-4 > div').last()

    await expect(submitBtn).toBeVisible()
    await submitBtn.click()

    const submissionOutcome = await Promise.race([
      resultHeading.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'result' as const),
      reviewBtn.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'review' as const),
      toast.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'toast' as const),
    ])

    if (submissionOutcome === 'toast') {
      const toastText = (await toast.innerText()).trim()
      throw new Error(`Không thể nộp bài: ${toastText}`)
    }

    await expect(resultHeading).toBeVisible({ timeout: 15000 })
    await expect(reviewBtn).toBeVisible({ timeout: 15000 })
    await reviewBtn.click()

    await expect(page.getByRole('heading', { name: 'Chi tiết đáp án & lời giải đề thi', exact: true })).toBeVisible({ timeout: 15000 })
  })

  test.afterAll(async () => {
    await db.quiz.deleteMany({ where: { title: quizTitle } })
  })
})
