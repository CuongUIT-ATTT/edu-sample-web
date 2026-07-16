import { test as setup, expect } from '@playwright/test'
import path from 'path'
import dotenv from 'dotenv'

// Load testing environment variables
dotenv.config({ path: '.env.test' })

const ROLES = [
  { 
    role: 'admin', 
    email: process.env.TEST_ADMIN_EMAIL || 'admin@eduweb.vn', 
    password: process.env.TEST_ADMIN_PASS || 'hungcuong123', 
    file: 'admin.json' 
  },
  { 
    role: 'teacher', 
    email: process.env.TEST_TEACHER_EMAIL || 'giangvien@eduweb.vn', 
    password: process.env.TEST_TEACHER_PASS || 'hungcuong123', 
    file: 'teacher.json' 
  },
  { 
    role: 'student', 
    email: process.env.TEST_STUDENT_EMAIL || 'hocvien@eduweb.vn', 
    password: process.env.TEST_STUDENT_PASS || 'hungcuong123', 
    file: 'student.json' 
  },
  { 
    role: 'parent', 
    email: process.env.TEST_PARENT_EMAIL || 'phuhuynh@eduweb.vn', 
    password: process.env.TEST_PARENT_PASS || 'hungcuong123', 
    file: 'parent.json' 
  },
]

for (const { role, email, password, file } of ROLES) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    await page.selectOption('select[name="role"]', role)
    await page.click('button[type="submit"]')
    
    // Wait for the login redirect to finish (should not stay on /login)
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 })
    
    // Save cookies & sessionStorage state
    const authPath = path.join('e2e', '.auth', file)
    await page.context().storageState({ path: authPath })
  })
}
