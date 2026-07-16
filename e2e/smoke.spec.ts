import { test, expect } from '@playwright/test'

const PAGES = [
  '/',
  '/quizzes',
  '/courses',
  '/admission',
  '/contact',
  '/about'
]

test.describe('Smoke Check - Public Pages', () => {
  for (const pagePath of PAGES) {
    test(`Verify page "${pagePath}" returns HTTP 200 and loads basic content`, async ({ page }) => {
      const response = await page.goto(pagePath)
      
      // Assert HTTP status code is 200
      expect(response?.status()).toBe(200)

      // Verify page is not a 404 or raw error
      await expect(page.locator('body')).not.toContainText('404')
      await expect(page.locator('body')).not.toContainText('Internal Server Error')
    })
  }
})
