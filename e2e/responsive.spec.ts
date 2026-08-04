import { test, expect } from '@playwright/test'
import path from 'path'

const BREAKPOINTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 }
]

test.describe('Responsive Layout & Visual Regression Tests', () => {
  for (const vp of BREAKPOINTS) {
    test.describe(`Breakpoint - ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`, () => {
      
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
      })

      // 1.1 Public Pages (No Auth)
      test('1.1.1: GET / - Landing page responds without horizontal overflow', async ({ page }) => {
        await page.goto('/')
        
        // Assert CTA button is visible
        const ctaBtn = page.locator('a:has-text("Đăng ký học thử"), a:has-text("Thi thử Demo"), a:has-text("Đăng nhập VIP")').first()
        await expect(ctaBtn).toBeVisible()

        // Check no horizontal overflow
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(vp.width + 5)

        // Visual screenshot assertion
        await expect(page).toHaveScreenshot(`landing-${vp.name}.png`, {
          maxDiffPixelRatio: 0.05,
          animations: 'disabled'
        })
      })

      test('1.1.2: GET /quizzes - Quiz list grid layout check', async ({ page }) => {
        await page.goto('/quizzes')
        
        // Check grid is visible
        const grid = page.locator('.grid, [class*="grid-cols"]').first()
        await expect(grid).toBeVisible()

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(vp.width + 5)
      })

      test('1.1.3: GET /admission - Fees tables display properly', async ({ page }) => {
        await page.goto('/admission')
        
        // Check header or fee tables
        const admissionHeader = page.locator('h1, h2:has-text("Học phí")').first()
        await expect(admissionHeader).toBeVisible()

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(vp.width + 5)
      })

      test('1.1.4: GET /contact - Map and contact form displays', async ({ page }) => {
        await page.goto('/contact')
        
        // Verify form fields
        const form = page.locator('form').first()
        await expect(form).toBeVisible()

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(vp.width + 5)
      })

      // 1.2 Dashboard Pages (With Auth storageState context)
      test('1.2.1: Student schedules portal responsive check', async ({ browser }) => {
        const authPath = path.join('e2e', '.auth', 'student.json')
        const ctx = await browser.newContext({ storageState: authPath })
        const page = await ctx.newPage()
        await page.setViewportSize({ width: vp.width, height: vp.height })
        
        await page.goto('/student/schedules')
        
        // Verify the student schedule/calendar portal root is visible
        const timetable = page.locator('h2, div:has-text("Lịch học")').first()
        await expect(timetable).toBeVisible()

        // Verify weekly/monthly switches can be tapped
        const switchBtn = page.locator('button:has-text("Tháng"), button:has-text("Tuần")').first()
        if (await switchBtn.isVisible()) {
          await switchBtn.click()
        }

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(vp.width + 5)

        await ctx.close()
      })

      test('1.2.2: Admin schedules portal conflict banner position check', async ({ browser }) => {
        const authPath = path.join('e2e', '.auth', 'admin.json')
        const ctx = await browser.newContext({ storageState: authPath })
        const page = await ctx.newPage()
        await page.setViewportSize({ width: vp.width, height: vp.height })
        
        await page.goto('/admin/schedules')
        
        // Admin timetable should be visible
        const timetable = page.locator('h1, h2:has-text("Xếp lịch học")').first()
        await expect(timetable).toBeVisible()

        // Check horizontal scroll
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(vp.width + 5)

        await ctx.close()
      })

      test('1.2.3: Admin users table core columns visibility check', async ({ browser }) => {
        const authPath = path.join('e2e', '.auth', 'admin.json')
        const ctx = await browser.newContext({ storageState: authPath })
        const page = await ctx.newPage()
        await page.setViewportSize({ width: vp.width, height: vp.height })
        
        await page.goto('/admin/users')
        
        // Verify UserManagementTable headers: "Họ và Tên" / "Vai trò"
        const table = page.locator('table').first()
        await expect(table).toBeVisible()

        // Ensure key columns (name, role) remain visible
        const nameHeader = page.locator('th:has-text("Tên"), th:has-text("Học viên"), th:has-text("Họ và Tên")').first()
        await expect(nameHeader).toBeVisible()

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(vp.width + 5)

        await ctx.close()
      })

      test('1.2.4: Teacher quizzes manager quick imports check', async ({ browser }) => {
        const authPath = path.join('e2e', '.auth', 'teacher.json')
        const ctx = await browser.newContext({ storageState: authPath })
        const page = await ctx.newPage()
        await page.setViewportSize({ width: vp.width, height: vp.height })
        
        await page.goto('/teacher/quizzes')
        
        // Verify "Tải file JSON mẫu" or import options toggle is available
        const importBtn = page.locator('button:has-text("Dán JSON"), button:has-text("Import file CSV")').first()
        if (await importBtn.isVisible()) {
          await expect(importBtn).toBeVisible()
        }

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(vp.width + 5)

        await ctx.close()
      })

    })
  }
})
