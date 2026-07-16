import { test, expect } from './fixtures/auth'

test.describe('Admin - Schedule Management UI flow', () => {

  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/admin/schedules')
    adminPage.on('response', async response => {
      if (response.request().method() === 'POST') {
        try {
          console.log('GLOBAL INTERCEPTED URL:', response.url())
          console.log('GLOBAL INTERCEPTED BODY:', await response.text())
        } catch (err) {}
      }
    })
  })

  // Test 2B-1: Form validation — nút "Tự động sửa"
  test('2B-1: Should show Day of Week mismatch error and correct it via auto-fix button', async ({ adminPage }) => {
    // 1. Select Thứ Tư (Wednesday) which is value 3
    await adminPage.locator('select').nth(3).selectOption('3')

    // 2. Input a Monday date (e.g. 2025-07-07)
    const dateInput = adminPage.locator('input[type="date"]').first()
    await dateInput.fill('2025-07-07')

    // 3. Verify mismatch warning message is shown in red
    const warning = adminPage.locator('p.text-red-500:has-text("không phải Thứ 4")')
    await expect(warning).toBeVisible()

    // 4. Verify create button is disabled
    const submitBtn = adminPage.locator('button[type="submit"]')
    await expect(submitBtn).toBeDisabled()

    // 5. Click "Tự động sửa"
    await adminPage.locator('button:has-text("Tự động sửa")').click()

    // 6. Verify date shifts to Wednesday
    const dateVal = await dateInput.inputValue()
    const day = new Date(dateVal).getDay()
    expect(day).toBe(3) // 3 represents Wednesday
    await expect(warning).not.toBeVisible()
    await expect(submitBtn).toBeEnabled()
  })

  // Test 2B-2: Dropdown giờ — auto-fill endTime
  test('2B-2: Should automatically set end time to start time + 90 mins and filter prior times', async ({ adminPage }) => {
    // Select Giờ bắt đầu = "08:00"
    const startSelect = adminPage.locator('select').nth(5)
    await startSelect.selectOption('08:00')

    // Verify Giờ kết thúc is auto-filled to "09:30"
    const endSelect = adminPage.locator('select').nth(6)
    await expect(endSelect).toHaveValue('09:30')

    // Verify end time options do not contain times less than or equal to start time
    const endOptions = await endSelect.locator('option').allTextContents()
    const invalidOptions = endOptions.filter(t => t <= '08:00' && t !== '— Chọn giờ —')
    expect(invalidOptions.length).toBe(0)
  })

  // Test 2B-3: Recurrence group collapse/expand and delete
  test('2B-3: Should display recurring schedule in summary row, expand it, and allow group deletion', async ({ adminPage }) => {
    // 1. Fill creating weekly schedule form
    await adminPage.locator('select').nth(0).selectOption({ index: 1 }) // Class
    await adminPage.locator('select').nth(1).selectOption({ index: 1 }) // Subject
    await adminPage.locator('select').nth(2).selectOption({ index: 1 }) // Teacher
    await adminPage.locator('select').nth(3).selectOption('3') // Wednesday
    
    // Choose start date: Wednesday 2025-07-02
    await adminPage.locator('input[type="date"]').first().fill('2025-07-02')

    // Select weekly recurrence
    await adminPage.locator('select').nth(4).selectOption('WEEKLY')

    // Choose end date: Wednesday 2025-07-23 (4 weeks: 02, 09, 16, 23)
    await adminPage.locator('input[type="date"]').nth(1).fill('2025-07-23')

    await adminPage.locator('select').nth(5).selectOption('08:00') // start time
    await adminPage.locator('select').nth(7).selectOption({ index: 1 }) // room

    // Submit form to create
    await adminPage.locator('button[type="submit"]').click()

    // 2. Wait for reload/revalidation and verify summary row is visible (shows 4 ca)
    const summaryRow = adminPage.locator('tr:has-text("4 ca")').first()
    await expect(summaryRow).toBeVisible()

    // 3. Verify collapse state (shows ▼ icon)
    await expect(summaryRow.locator('span:has-text("▼")')).toBeVisible()

    // 4. Click row to expand
    await summaryRow.click()

    // 5. Verify expand state (shows ▲ icon) and 4 sub-rows are visible
    await expect(summaryRow.locator('span:has-text("▲")')).toBeVisible()
    const detailRows = adminPage.locator('tr:has-text("↳ Ca học")')
    const count = await detailRows.count()
    expect(count).toBeGreaterThanOrEqual(4)

    // 6. Click delete group button (Trash button inside summary row)
    const deleteGroupBtn = summaryRow.locator('button')
    
    // Accept standard confirm alert
    adminPage.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Bạn có chắc chắn muốn xóa toàn bộ chuỗi')
      await dialog.accept()
    })

    await deleteGroupBtn.click()
    
    // Verify summary row is removed
    await expect(summaryRow).not.toBeVisible()
  })

  // Test 2B-4: Homework submission guard on UI
  test('2B-4: Should show validation error alert when trying to delete schedule that has homework submissions', async ({ adminPage }) => {
    // Intercept Server Action response for deleteSchedule to return custom guard error
    await adminPage.route('**/admin/schedules', async route => {
      const request = route.request()
      if (request.method() === 'POST') {
        const headers = request.headers()
        // Check Next.js action request
        if (headers['next-action'] || headers['content-type']?.includes('multipart/form-data')) {
          await route.fulfill({
            status: 200,
            contentType: 'text/x-component',
            body: `0:{"a":"$@1","f":"","q":"","i":false}\n1:{"success":false,"error":"Không thể xóa: Học viên đã nộp bài tập cho ca học này. Vui lòng chấm điểm bài nộp trước."}\n`
          })
          return
        }
      }
      await route.continue()
    })

    // Click delete on any schedule element
    const deleteBtn = adminPage.locator('.lucide-trash-2').first()
    await expect(deleteBtn).toBeAttached()

    adminPage.on('dialog', async dialog => {
      await dialog.accept() // Accept confirmation dialog if shown
    })
    await deleteBtn.click({ force: true })

    // Check that error banner is shown
    adminPage.on('console', msg => {
      console.log('BROWSER CONSOLE:', msg.type(), msg.text())
    })

    adminPage.on('response', async response => {
      if (response.request().method() === 'POST') {
        try {
          console.log('INTERCEPTED ACTION URL:', response.url())
          console.log('INTERCEPTED ACTION STATUS:', response.status())
          console.log('INTERCEPTED ACTION HEADERS:', response.headers())
          console.log('INTERCEPTED ACTION BODY:', await response.text())
        } catch (err) {}
      }
    })

    const errorBanner = adminPage.locator('div.bg-red-50:has-text("Không thể xóa: Học viên đã nộp bài tập")')
    await expect(errorBanner).toBeVisible()
  })

})
