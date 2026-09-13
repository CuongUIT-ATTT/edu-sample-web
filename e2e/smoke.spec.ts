import { test, expect } from '@playwright/test'
import { gotoWithDisclaimerAccepted } from './helpers/auth'

const PAGES = [
  { path: '/', text: 'Luyện Thi Thông Minh' },
  { path: '/quizzes', text: 'Đề Thi Thử Thực Chiến Công Khai' },
  { path: '/documents', text: 'Tài Liệu Ôn Thi & Tóm Tắt Lý Thuyết' },
  { path: '/admission', text: 'Đăng Ký Tuyển Sinh Trực Tuyến' },
  { path: '/contact', text: 'Đồng Hành Cùng Bạn 24/7' },
  { path: '/privacy', text: 'Chính Sách Bảo Mật' },
  { path: '/terms', text: 'Điều Khoản Sử Dụng' },
]

test.describe('Smoke Check - Public Pages', () => {
  for (const { path, text } of PAGES) {
    test(`Verify page "${path}" loads basic content`, async ({ page }) => {
      await gotoWithDisclaimerAccepted(page, path)

      await expect(page.getByText(text, { exact: false }).first()).toBeVisible()
      await expect(page.locator('body')).not.toContainText('Internal Server Error')
    })
  }
})
