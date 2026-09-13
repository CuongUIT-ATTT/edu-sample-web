import { test as setup } from '@playwright/test'
import { getStorageStatePath, setAuthenticatedSession, USER_ROLES } from './helpers/auth'

for (const role of USER_ROLES) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    await setAuthenticatedSession(page, role)
    await page.context().storageState({ path: getStorageStatePath(role) })
  })
}
