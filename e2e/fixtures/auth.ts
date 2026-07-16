import { test as base, Page } from '@playwright/test'
import path from 'path'

type AuthFixtures = {
  adminPage: Page
  teacherPage: Page
  studentPage: Page
  parentPage: Page
}

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const authPath = path.join('e2e', '.auth', 'admin.json')
    const ctx = await browser.newContext({ storageState: authPath })
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },
  teacherPage: async ({ browser }, use) => {
    const authPath = path.join('e2e', '.auth', 'teacher.json')
    const ctx = await browser.newContext({ storageState: authPath })
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },
  studentPage: async ({ browser }, use) => {
    const authPath = path.join('e2e', '.auth', 'student.json')
    const ctx = await browser.newContext({ storageState: authPath })
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },
  parentPage: async ({ browser }, use) => {
    const authPath = path.join('e2e', '.auth', 'parent.json')
    const ctx = await browser.newContext({ storageState: authPath })
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },
})

export { expect } from '@playwright/test'
