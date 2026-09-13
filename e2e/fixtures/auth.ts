import { test as base, Page } from '@playwright/test'
import { newAuthenticatedPage } from '../helpers/auth'

type AuthFixtures = {
  adminPage: Page
  teacherPage: Page
  studentPage: Page
  parentPage: Page
}

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const { context, page } = await newAuthenticatedPage(browser, 'admin')
    await use(page)
    await context.close()
  },
  teacherPage: async ({ browser }, use) => {
    const { context, page } = await newAuthenticatedPage(browser, 'teacher')
    await use(page)
    await context.close()
  },
  studentPage: async ({ browser }, use) => {
    const { context, page } = await newAuthenticatedPage(browser, 'student')
    await use(page)
    await context.close()
  },
  parentPage: async ({ browser }, use) => {
    const { context, page } = await newAuthenticatedPage(browser, 'parent')
    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'
