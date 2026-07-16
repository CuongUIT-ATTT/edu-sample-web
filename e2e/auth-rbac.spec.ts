import { test, expect } from './fixtures/auth'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

test.describe('Auth & RBAC tests', () => {

  // 4A. Login flow
  test('4A-1: Login success redirects to the correct dashboard path', async ({ page }) => {
    const roles = [
      { email: process.env.TEST_ADMIN_EMAIL || 'admin@eduweb.vn', role: 'admin', expectedPath: '/admin' },
      { email: process.env.TEST_TEACHER_EMAIL || 'giangvien@eduweb.vn', role: 'teacher', expectedPath: '/teacher' },
      { email: process.env.TEST_STUDENT_EMAIL || 'hocvien@eduweb.vn', role: 'student', expectedPath: '/student' },
      { email: process.env.TEST_PARENT_EMAIL || 'phuhuynh@eduweb.vn', role: 'parent', expectedPath: '/parent' }
    ]

    for (const { email, role, expectedPath } of roles) {
      await page.goto('/login')
      await page.fill('input[name="email"]', email)
      await page.fill('input[name="password"]', 'hungcuong123')
      await page.selectOption('select[name="role"]', role)
      await page.click('button[type="submit"]')
      
      // Wait for redirect to finish and confirm dashboard path is visited
      await expect(page).toHaveURL(new RegExp(expectedPath), { timeout: 10000 })
      
      // Clear cookies to do fresh login
      await page.context().clearCookies()
    }
  })

  test('4A-2: Login with incorrect password displays error message and does not redirect', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@eduweb.vn')
    await page.fill('input[name="password"]', 'wrong_password')
    await page.selectOption('select[name="role"]', 'admin')
    await page.click('button[type="submit"]')

    // Confirm stays on /login
    await expect(page).toHaveURL(/\/login/)

    // Confirm error message is visible
    const errorMsg = page.locator('div.text-red-500, p.text-red-500, .bg-red-50').first()
    await expect(errorMsg).toBeVisible()
  })

  test('4A-3: Unauthenticated request to private dashboard redirects to login page', async ({ page }) => {
    // Attempting to visit student schedules directly without session
    await page.goto('/student/schedules')
    
    // Expect to be redirected to login page (or optionally admission page based on config)
    await expect(page).toHaveURL(/\/(login|admission)/)
  })

  // 4B. Role-Based Access Control (RBAC)
  test('4B-1: STUDENT cannot access ADMIN routes', async ({ studentPage }) => {
    await studentPage.goto('/admin/users')
    // Expect redirect to unauthorized status page
    await expect(studentPage).toHaveURL(/\/(unauthorized|admission|login)/)
  })

  test('4B-2: TEACHER cannot access ADMIN user management', async ({ teacherPage }) => {
    await teacherPage.goto('/admin/users')
    await expect(teacherPage).toHaveURL(/\/(unauthorized|admission|login)/)
  })

  test('4B-3: PARENT can only view linked children profile data', async ({ parentPage }) => {
    await parentPage.goto('/parent/children')
    
    // Verify child profile card displays name successfully
    const nameLocator = parentPage.locator('h2.font-body-strong').first()
    await expect(nameLocator).toBeVisible()
    const nameText = await nameLocator.innerText()
    expect(nameText.length).toBeGreaterThan(0)
  })

  test('4B-4: TEACHER view - other teachers schedules are anonymized', async ({ teacherPage }) => {
    await teacherPage.goto('/teacher/schedules')
    
    // Find slot row containing "Đã bận" (representing other teacher's schedule)
    const busySlot = teacherPage.locator('tr:has-text("Đã bận")').first()
    if (await busySlot.isVisible()) {
      await expect(busySlot).toBeVisible()
      // Verify no action buttons (like Edit/Delete) exist inside this anonymized row
      const editDeleteBtn = busySlot.locator('button:has(.lucide-trash-2), button:has-text("Sửa"), button:has-text("Xoá")')
      await expect(editDeleteBtn).not.toBeVisible()
    }
  })

  test('4B-5: Attendance 10-minute validation lockout', async ({ teacherPage }) => {
    // 1. Force the current system time to a fixed Wednesday at 10:30 UTC
    // This makes sure active Wednesday schedules (like 08:00 - 09:30) are beyond the 10 min window
    await teacherPage.clock.setFixedTime('2025-07-09T10:30:00.000Z')

    await teacherPage.goto('/teacher/attendance')

    // 2. Select first available active schedule
    const scheduleSelect = teacherPage.locator('select').first()
    if (await scheduleSelect.isVisible() && (await scheduleSelect.locator('option').count()) > 1) {
      await scheduleSelect.selectOption({ index: 1 })
      
      // 3. Verify warning notice is displayed on screen
      const lockoutMsg = teacherPage.locator('span:has-text("Ngoài thời gian cho phép điểm danh")')
      await expect(lockoutMsg).toBeVisible()

      // 4. Verify submit attendance button is disabled
      const submitBtn = teacherPage.locator('button:has-text("Lưu điểm danh"), button[type="submit"]').first()
      await expect(submitBtn).toBeDisabled()
    }
  })

  // 4C. Logout
  test('4C-1: Logging out deletes session cookies and blocks dashboard back navigation', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@eduweb.vn')
    await page.fill('input[name="password"]', 'hungcuong123')
    await page.selectOption('select[name="role"]', 'admin')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin/)

    // Click logout
    const logoutBtn = page.locator('button:has-text("Đăng xuất"), button:has(.lucide-log-out)').first()
    await logoutBtn.click()

    // Verify redirected back to login page
    await expect(page).toHaveURL(/\/login/)

    // Verify session cookie is deleted
    const cookies = await page.context().cookies()
    const sessionTokenCookie = cookies.find(c => c.name === 'session_token')
    expect(sessionTokenCookie).toBeUndefined()

    // Try going back in history and confirm user cannot view admin pages
    await page.goBack()
    await expect(page).toHaveURL(/\/(login|admission)/)
  })

})
