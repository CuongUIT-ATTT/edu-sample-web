import { test, expect } from '@playwright/test'
import { gotoWithDisclaimerAccepted } from './helpers/auth'

test('footer and public links return non-error pages', async ({ page }) => {
  await gotoWithDisclaimerAccepted(page, '/quizzes')
  await expect(page.getByRole('heading', { name: 'Đề Thi Thử Thực Chiến Công Khai', exact: true })).toBeVisible()

  await gotoWithDisclaimerAccepted(page, '/documents')
  await expect(page.getByRole('heading', { name: 'Tài Liệu Ôn Thi & Tóm Tắt Lý Thuyết', exact: true })).toBeVisible()

  await gotoWithDisclaimerAccepted(page, '/admission')
  await expect(page.getByRole('heading', { name: 'Đăng Ký Tuyển Sinh Trực Tuyến', exact: true })).toBeVisible()

  await gotoWithDisclaimerAccepted(page, '/contact')
  await expect(page.getByRole('heading', { name: 'Đồng Hành Cùng Bạn 24/7', exact: true })).toBeVisible()

  await gotoWithDisclaimerAccepted(page, '/privacy')
  await expect(page.getByRole('heading', { name: 'Chính Sách Bảo Mật', exact: true })).toBeVisible()

  await gotoWithDisclaimerAccepted(page, '/terms')
  await expect(page).toHaveURL(/\/terms(?:$|[/?#])/)
  await expect(page.getByRole('heading', { name: 'Điều Khoản Sử Dụng', exact: true })).toBeVisible()

  await gotoWithDisclaimerAccepted(page, '/news')
  await expect(page.getByRole('heading', { name: 'Bản Tin & Sự Kiện', exact: true })).toBeVisible()
})
