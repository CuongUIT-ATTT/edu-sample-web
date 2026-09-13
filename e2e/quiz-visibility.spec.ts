import { test, expect } from '@playwright/test'
import { db } from '@/lib/db'
import { gotoWithDisclaimerAccepted, setAuthenticatedSession } from './helpers/auth'

async function createLatePublicQuiz(title: string): Promise<{ quizUrl: string; cleanup: () => Promise<void> }> {
  const teacher = await db.teacherProfile.findFirstOrThrow({
    where: { user: { email: 'teacher.toan@eduweb.vn' } },
    select: { id: true },
  })
  const subject = await db.subject.findFirstOrThrow({ where: { code: 'CIVIC101' }, select: { id: true } })
  const quiz = await db.quiz.create({
    data: {
      title,
      description: 'Late deadline quiz generated directly from E2E data.',
      duration: 15,
      passingScore: 5,
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isPublic: true,
      answerVisibility: 'IMMEDIATELY',
      shuffleQuestions: false,
      teacherId: teacher.id,
      subjectId: subject.id,
      questions: {
        create: [
          {
            text: '2 + 2 = ?',
            type: 'MULTIPLE_CHOICE',
            options: ['4', '3', '2', '1'],
            correctAnswer: '0',
            score: 1,
            explanation: 'Đáp án đúng là 4',
          },
        ],
      },
    },
    include: { questions: true },
  })

  const cleanup = async () => {
    await db.quiz.deleteMany({ where: { id: quiz.id } })
  }

  return { quizUrl: `http://localhost:3000/quizzes/${quiz.id}`, cleanup }
}

test.describe('Quiz deadline + answer visibility', () => {
  test.setTimeout(60000)

  test('UI gating: AFTER_ALL_SUBMITTED disabled khi public hoặc chưa chọn lớp', async ({ page }) => {
    await setAuthenticatedSession(page, 'admin')
    await gotoWithDisclaimerAccepted(page, '/admin/quizzes')

    const createButton = page.locator('main').getByRole('button', { name: 'Tạo đề thi trắc nghiệm mới' })
    await expect(createButton).toBeVisible()
    await createButton.scrollIntoViewIfNeeded()
    await createButton.evaluate((el) => (el as HTMLButtonElement).click())

    const modalRoot = page.locator('div.fixed.inset-0.z-50').last()
    await expect(modalRoot).toBeVisible({ timeout: 10000 })
    const modalForm = modalRoot.locator('form').last()
    const visibilitySelect = modalForm.locator('select', { has: page.locator('option[value="AFTER_ALL_SUBMITTED"]') })
    const class10A1 = modalForm.getByLabel('10A1')
    const class10A2 = modalForm.getByLabel('10A2')

    await expect(class10A1).toBeVisible({ timeout: 10000 })
    await expect(visibilitySelect).toBeVisible({ timeout: 10000 })
    await expect.poll(async () => {
      return visibilitySelect.evaluate((el) => {
        const select = el as HTMLSelectElement
        const option = Array.from(select.options).find((item) => item.value === 'AFTER_ALL_SUBMITTED')
        return option?.disabled ?? null
      })
    }).toBe(true)

    await class10A1.check()
    await expect(modalForm.getByText('Lớp').first()).toBeVisible({ timeout: 10000 })
    await expect(modalForm.getByText('10A1').last()).toBeVisible({ timeout: 10000 })
    await expect.poll(async () => {
      return visibilitySelect.evaluate((el) => {
        const select = el as HTMLSelectElement
        const option = Array.from(select.options).find((item) => item.value === 'AFTER_ALL_SUBMITTED')
        return option?.disabled ?? null
      })
    }).toBe(false)

    await class10A2.check()
    await expect(modalForm.getByText('10A2').last()).toBeVisible({ timeout: 10000 })
    await expect(modalForm.locator('input[type="datetime-local"]')).toHaveCount(5)

    await modalForm.locator('#isPublic').evaluate((el) => (el as HTMLInputElement).click())
    await expect.poll(async () => {
      return visibilitySelect.evaluate((el) => {
        const select = el as HTMLSelectElement
        const option = Array.from(select.options).find((item) => item.value === 'AFTER_ALL_SUBMITTED')
        return option?.disabled ?? null
      })
    }).toBe(true)
    await expect(visibilitySelect).toHaveValue('IMMEDIATELY')

  })

  test('Deadline quá khứ → học sinh thấy badge Nộp muộn sau khi nộp', async ({ page }) => {
    const quizTitle = `E2E Late Deadline ${Date.now()}`
    const { quizUrl, cleanup } = await createLatePublicQuiz(quizTitle)

    try {
      await gotoWithDisclaimerAccepted(page, quizUrl)
      const guestInput = page.locator('input[placeholder="Ví dụ: Nguyễn Văn A..."]').first()
      const agreementCheckbox = page.getByRole('checkbox').first()
      const startButton = page.getByRole('button', { name: 'Vào làm bài (Tính giờ)', exact: true })
      const rulesHeading = page.getByRole('heading', { name: /Quy Chế Phòng Thi & Chống Gian Lận/ })
      const guestNameLabel = page.getByText('Họ Tên Thí Sinh:')

      await expect(page.getByRole('heading', { name: quizTitle, exact: true })).toBeVisible({ timeout: 10000 })
      await expect(page.getByText('Vui lòng xem kỹ trước khi bắt đầu tính giờ làm bài.')).toBeVisible({ timeout: 10000 })
      await expect(guestNameLabel).toBeVisible({ timeout: 10000 })
      await expect(guestInput).toBeVisible({ timeout: 10000 })
      await guestInput.fill('Nguyen Van Test')
      await expect(rulesHeading).toBeVisible({ timeout: 10000 })
      await expect(agreementCheckbox).toBeVisible({ timeout: 10000 })
      await agreementCheckbox.check()
      await expect(agreementCheckbox).toBeChecked()
      await expect(startButton).toBeVisible({ timeout: 10000 })

      const submitButton = page.getByRole('button', { name: 'Nộp bài thi', exact: true }).first()
      const toast = page.locator('div.fixed.top-4.right-4 > div').last()
      await startButton.click()

      const startOutcome = await Promise.race([
        submitButton.waitFor({ state: 'visible', timeout: 30000 }).then(() => 'started' as const),
        toast.waitFor({ state: 'visible', timeout: 30000 }).then(() => 'toast' as const),
      ])

      if (startOutcome === 'toast') {
        const toastText = (await toast.innerText()).trim()
        expect(toastText).toContain('quá hạn')
        await page.getByRole('button', { name: '✕' }).click().catch(() => {})
      }

      await expect(submitButton).toBeVisible({ timeout: 10000 })

      const firstQuestion = page.locator('.bg-canvas', { hasText: '2 + 2 = ?' }).first()
      await expect(firstQuestion).toBeVisible({ timeout: 10000 })
      await firstQuestion.getByRole('button').first().click()
      await page.getByRole('button', { name: 'Nộp bài thi', exact: true }).first().click()

      await expect(page.getByRole('heading', { name: /Kết quả của/i })).toBeVisible({ timeout: 15000 })
      await expect(page.locator('span:has-text("Nộp muộn")').first()).toBeVisible({ timeout: 15000 })
    } finally {
      await cleanup()
    }
  })
})
