import { test, expect } from './fixtures/auth'

test.describe('Admin - Schedule Management UI flow', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/admin/calendar')
  })

  test('2B-1: Should open the schedule registration modal from admin calendar', async ({ adminPage }) => {
    const createButton = adminPage.locator('button:has-text("Đăng ký lịch")')
    const viewport = adminPage.viewportSize()

    if (viewport && viewport.width < 640) {
      await expect(createButton).toBeHidden()
      return
    }

    await createButton.click()

    await expect(adminPage.locator('h3:has-text("Đăng ký lịch học")')).toBeVisible()
    await expect(adminPage.locator('label:has-text("Giờ bắt đầu *")')).toBeVisible()
    await expect(adminPage.locator('label:has-text("Giờ kết thúc *")')).toBeVisible()
  })

  test('2B-2: Should show and clear the day/date mismatch warning in the modal', async ({ adminPage }) => {
    const createButton = adminPage.locator('button:has-text("Đăng ký lịch")')
    const viewport = adminPage.viewportSize()

    if (viewport && viewport.width < 640) {
      await expect(createButton).toBeHidden()
      return
    }

    await createButton.click()

    const formPanel = adminPage.locator('h3:has-text("Đăng ký lịch học")').locator('..').locator('..')
    await expect(formPanel).toBeVisible()

    await formPanel.locator('select').nth(3).selectOption('3')

    const dateInput = formPanel.locator('input[type="date"]').first()
    await dateInput.fill('2025-07-07')

    const warning = formPanel.locator('text=Ngày không khớp với thứ đã chọn')
    await expect(warning).toBeVisible()

    await dateInput.fill('2025-07-09')
    await expect(warning).toHaveCount(0)
  })

  test('2B-3: Should toggle weekly recurrence end-date controls', async ({ adminPage }) => {
    const createButton = adminPage.locator('button:has-text("Đăng ký lịch")')
    const viewport = adminPage.viewportSize()

    if (viewport && viewport.width < 640) {
      await expect(createButton).toBeHidden()
      return
    }

    await createButton.click()

    const formPanel = adminPage.locator('h3:has-text("Đăng ký lịch học")').locator('..').locator('..')
    await expect(formPanel).toBeVisible()

    await formPanel.locator('button:has-text("Hàng tuần")').click()
    await expect(formPanel.locator('label:has-text("Ngày kết thúc *")')).toBeVisible()

    await formPanel.locator('button:has-text("Chỉ 1 buổi")').click()
    await expect(formPanel.locator('label:has-text("Ngày kết thúc *")')).toHaveCount(0)
  })
})
