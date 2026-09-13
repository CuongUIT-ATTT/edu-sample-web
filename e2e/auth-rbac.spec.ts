import { test, expect } from './fixtures/auth'
import { gotoWithDisclaimerAccepted, loginAsRole, type UserRole } from './helpers/auth'

test.describe('Auth & RBAC tests', () => {
  const roles: UserRole[] = ['admin', 'teacher', 'student', 'parent']

  for (const role of roles) {
    test(`4A-1:${role} Login success redirects to the correct dashboard path`, async ({ browser }) => {
      const context = await browser.newContext()
      const page = await context.newPage()

      await loginAsRole(page, role)

      await context.close()
    })
  }

  test('4A-2: Login with incorrect password displays error message and does not redirect', async ({ page }) => {
    await gotoWithDisclaimerAccepted(page, '/login')
    await page.fill('input[name="email"]', 'admin@eduweb.vn')
    await page.fill('input[name="password"]', 'wrong_password')
    await page.selectOption('select[name="role"]', 'admin')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('div.text-red-500, p.text-red-500, .bg-red-50').first()).toBeVisible()
  })

  test('4A-3: Unauthenticated request to private dashboard redirects to login page', async ({ page }) => {
    await gotoWithDisclaimerAccepted(page, '/student/calendar')
    await expect(page).toHaveURL(/\/login/)
  })

  test('4B-1: STUDENT cannot access ADMIN routes', async ({ studentPage }) => {
    await studentPage.goto('/admin/users')
    await expect(studentPage).toHaveURL(/\/(unauthorized|login)/)
  })

  test('4B-2: TEACHER cannot access ADMIN user management', async ({ teacherPage }) => {
    await teacherPage.goto('/admin/users')
    await expect(teacherPage).toHaveURL(/\/(unauthorized|login)/)
  })

  test('4B-3: PARENT can only view linked children profile data', async ({ parentPage }) => {
    await parentPage.goto('/parent/children')

    await expect(
      parentPage.getByRole('heading', { name: 'Hồ sơ học tập của con', level: 1 }),
    ).toBeVisible()

    const unlinkedState = parentPage.getByText('Chưa liên kết hồ sơ học sinh.')
    const linkedState = parentPage.getByRole('heading', { name: 'Giáo viên chủ nhiệm' })

    if (await unlinkedState.isVisible().catch(() => false)) {
      await expect(unlinkedState).toBeVisible()
    } else {
      await expect(linkedState).toBeVisible()
      await expect(parentPage.getByText('Giờ tiếp phụ huynh:')).toBeVisible()
    }
  })

  test('4B-4: TEACHER calendar page renders successfully', async ({ teacherPage }) => {
    await teacherPage.goto('/teacher/calendar')
    await expect(teacherPage.locator('button:has-text("Tuần")').first()).toBeVisible()
    await expect(teacherPage.locator('button:has-text("Tháng")').first()).toBeVisible()
  })

  test('4B-5: Attendance 10-minute validation lockout', async ({ teacherPage }) => {
    await teacherPage.clock.setFixedTime('2025-07-09T10:30:00.000Z')
    await teacherPage.goto('/teacher/attendance')

    const scheduleSelect = teacherPage.locator('select').first()
    if (await scheduleSelect.isVisible() && (await scheduleSelect.locator('option').count()) > 1) {
      await scheduleSelect.selectOption({ index: 1 })

      const lockoutMsg = teacherPage.locator('h4:has-text("Ngoài thời gian điểm danh quy định")')
      await expect(lockoutMsg).toBeVisible()

      const submitBtn = teacherPage.getByRole('button', { name: 'Lưu điểm danh', exact: true })
      await expect(submitBtn).toBeVisible({ timeout: 10000 })
      await expect(submitBtn).toBeDisabled()
    }
  })

  test('4C-1: Logging out deletes session cookies and blocks dashboard back navigation', async ({ adminPage }) => {
    const page = adminPage
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin(?:$|[/?#])/, { timeout: 10000 })

    const adminHeading = page.getByRole('heading', { name: 'Xin chào, Quản trị viên' })
    await expect(adminHeading).toBeVisible({ timeout: 10000 })

    if (page.viewportSize()?.width && page.viewportSize()!.width < 768) {
      await page.locator('header button').first().click()
      await expect(page.locator('aside')).toBeVisible({ timeout: 10000 })
    }

    const sidebar = page.locator('aside')
    const logoutButton = sidebar.locator('button').last()
    await expect(logoutButton).toBeVisible({ timeout: 10000 })

    await logoutButton.scrollIntoViewIfNeeded()
    await Promise.all([
      page.waitForURL(/\/login/, { timeout: 10000 }),
      logoutButton.click(),
    ])

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 })

    await expect
      .poll(async () => {
        const cookies = await page.context().cookies()
        return cookies.some((cookie) => cookie.name === 'session_token')
      }, { timeout: 15000 })
      .toBe(false)

    await page.goto('/admin')
    await expect(page).toHaveURL(/\/(login|unauthorized)/, { timeout: 10000 })
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 })

    await page.evaluate(() => history.back())
    await expect(page).toHaveURL(/\/(login|unauthorized)/, { timeout: 10000 })
  })
})
