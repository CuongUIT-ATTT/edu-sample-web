import { test, expect } from './fixtures/auth'

test.describe('Student payment page (Học phí)', () => {
  test('student payment page renders tuition section', async ({ studentPage }) => {
    await studentPage.goto('/student/payment')

    await expect(
      studentPage.getByRole('heading', { name: 'Học phí & Thanh toán trực tuyến', level: 1 }),
    ).toBeVisible()
    await expect(studentPage.getByText('Không thể tải thông tin học phí. Vui lòng thử lại sau.')).not.toBeVisible()
  })

  test('student payment nav item is present in sidebar', async ({ studentPage }) => {
    await studentPage.goto('/student')
    const nav = studentPage.locator('nav')
    await expect(nav.getByRole('link', { name: 'Học phí' })).toBeVisible()
  })
})
