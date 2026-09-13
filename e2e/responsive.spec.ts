import { test, expect } from '@playwright/test'
import { gotoWithDisclaimerAccepted, newAuthenticatedPage } from './helpers/auth'

const BREAKPOINTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]

test.describe('Responsive Layout & Visual Regression Tests', () => {
  for (const vp of BREAKPOINTS) {
    test.describe(`Breakpoint - ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
      })

      test('1.1.1: GET / - Landing page responds without horizontal overflow', async ({ page }) => {
        await gotoWithDisclaimerAccepted(page, '/')

        const ctaBtn = page.locator('a:has-text("Đăng ký học thử miễn phí"), a:has-text("Thi thử Demo ngay")').first()
        await expect(ctaBtn).toBeVisible()

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(vp.width + 5)

        if (!process.env.CI) {
          await expect(page).toHaveScreenshot(`landing-${vp.name}.png`, {
            maxDiffPixelRatio: 0.05,
            animations: 'disabled',
          })
        }
      })

      test('1.1.2: GET /quizzes - Quiz list grid layout check', async ({ page }) => {
        await gotoWithDisclaimerAccepted(page, '/quizzes')
        await expect(page.locator('main')).toBeVisible()

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(vp.width + 5)
      })

      test('1.1.3: GET /admission - Fees tables display properly', async ({ page }) => {
        await gotoWithDisclaimerAccepted(page, '/admission')

        const admissionHeader = page.getByRole('heading', { name: 'Đăng Ký Tuyển Sinh Trực Tuyến', level: 1 })
        await expect(admissionHeader).toBeVisible()

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(vp.width + 5)
      })

      test('1.1.4: GET /contact - Map and contact form displays', async ({ page }) => {
        await gotoWithDisclaimerAccepted(page, '/contact')
        await expect(page.locator('form').first()).toBeVisible()

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(vp.width + 5)
      })

      test('1.2.1: Student calendar portal responsive check', async ({ browser }) => {
        const { context, page } = await newAuthenticatedPage(browser, 'student')
        await page.setViewportSize({ width: vp.width, height: vp.height })

        await page.goto('/student/calendar')
        await expect(page.locator('button:has-text("Tuần")').first()).toBeVisible()

        const switchBtn = page.locator('button:has-text("Tháng")').first()
        await expect(switchBtn).toBeVisible()
        await switchBtn.click()

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(vp.width + 5)

        await context.close()
      })

      test('1.2.2: Admin calendar portal responsive check', async ({ browser }) => {
        const { context, page } = await newAuthenticatedPage(browser, 'admin')
        await page.setViewportSize({ width: vp.width, height: vp.height })

        await page.goto('/admin/calendar')
        await expect(page.locator('button:has-text("Tuần")').first()).toBeVisible()

        const createButton = page.locator('button:has-text("Đăng ký lịch")')
        if (vp.width < 640) {
          await expect(createButton).toBeHidden()
        } else {
          await expect(createButton).toBeVisible()
        }

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(vp.width + 5)

        await context.close()
      })

      test('1.2.3: Admin users table core columns visibility check', async ({ browser }) => {
        const { context, page } = await newAuthenticatedPage(browser, 'admin')
        await page.setViewportSize({ width: vp.width, height: vp.height })

        await page.goto('/admin/users')

        if (vp.width < 768) {
          await expect(page.locator('table').first()).toBeHidden()
          await expect(page.locator('button[title="Chỉnh sửa"]').first()).toBeVisible()
        } else {
          await expect(page.locator('table').first()).toBeVisible()

          const nameHeader = page.locator('th:has-text("Tên"), th:has-text("Học viên"), th:has-text("Họ và Tên")').first()
          await expect(nameHeader).toBeVisible()
        }

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(vp.width + 5)

        await context.close()
      })

      test('1.2.4: Teacher quizzes manager quick imports check', async ({ browser }) => {
        const { context, page } = await newAuthenticatedPage(browser, 'teacher')
        await page.setViewportSize({ width: vp.width, height: vp.height })

        await page.goto('/teacher/quizzes')
        await page.locator('button:has-text("Tạo đề thi trắc nghiệm mới")').click()

        const modal = page.locator('div.fixed.inset-0').last()
        await expect(modal.locator('button:has-text("Dán JSON")')).toBeVisible()
        await expect(modal.locator('button:has-text("PDF → Chọn vùng ảnh")')).toBeVisible()

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(vp.width + 5)

        await context.close()
      })
    })
  }
})
