import { test, expect } from '@playwright/test'
import path from 'path'
import { loginAsRole } from './helpers/auth'

test.describe('PDF Region Selector - Phase 2', () => {
  test.setTimeout(60000)

  test('upload PDF, render page, vẽ vùng, gán câu hỏi', async ({ page }) => {
    await loginAsRole(page, 'admin')

    await page.goto('/admin/quizzes')

    const createButton = page.locator('main').getByRole('button', { name: 'Tạo đề thi trắc nghiệm mới' })
    await expect(createButton).toBeVisible({ timeout: 10000 })
    await createButton.evaluate((el) => (el as HTMLButtonElement).click())

    const modalRoot = page.locator('div.fixed.inset-0.z-50').last()
    await expect(modalRoot).toBeVisible({ timeout: 10000 })

    await modalRoot.getByRole('button', { name: 'PDF → Chọn vùng ảnh', exact: true }).click()
    await expect(modalRoot.getByText('Chọn tài liệu PDF để khoanh vùng ảnh')).toBeVisible({ timeout: 10000 })

    const pdfInput = modalRoot.locator('input[type="file"][accept="application/pdf,.pdf"]')
    await expect(pdfInput).toBeAttached()
    await pdfInput.setInputFiles(path.resolve('public/docs/sample-quiz.pdf'))

    const canvas = modalRoot.locator('canvas').first()
    await expect(modalRoot.getByRole('button', { name: 'Chọn PDF khác', exact: true })).toBeVisible({ timeout: 20000 })
    await expect(canvas).toBeVisible({ timeout: 20000 })
    await expect(modalRoot.getByText('Đang tải PDF...')).toHaveCount(0, { timeout: 20000 })

    const canvasBox = await canvas.boundingBox()
    expect(canvasBox).not.toBeNull()
    expect(canvasBox!.width).toBeGreaterThan(10)
    expect(canvasBox!.height).toBeGreaterThan(10)

    await canvas.scrollIntoViewIfNeeded()
    const box = (await canvas.boundingBox())!
    const firstDragY = Math.max(box.y, 80) + 40
    await page.mouse.move(box.x + 80, firstDragY)
    await page.mouse.down()
    await page.mouse.move(box.x + 300, firstDragY + 60, { steps: 5 })
    await page.mouse.up()

    const secondDragY = firstDragY + 90
    await page.mouse.move(box.x + 80, secondDragY)
    await page.mouse.down()
    await page.mouse.move(box.x + 250, secondDragY + 50, { steps: 5 })
    await page.mouse.up()

    const regionControls = modalRoot.locator('[data-region-control]')
    await expect(regionControls).toHaveCount(2)
    await expect(modalRoot.getByText('#1')).toHaveCount(1)
    await expect(modalRoot.getByText('#2')).toHaveCount(1)

    await expect(modalRoot.locator('[data-region-control] select')).toHaveCount(2)

    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('[data-region-control] select'))
      for (const select of selects) {
        const element = select as HTMLSelectElement
        element.value = '0'
        element.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
    await expect(modalRoot.getByRole('button', { name: 'Crop & gắn ảnh', exact: true })).toBeVisible()
  })
})
