import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { type JWTPayload, SignJWT } from 'jose'
import dotenv from 'dotenv'
import path from 'path'
import { db } from '@/lib/db'

dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.test', override: true })

export const DISCLAIMER_STORAGE_KEY = 'eduweb_disclaimer_accepted'

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent'

interface RoleCredentials {
  role: UserRole
  email: string
  password: string
  storageFile: string
}

interface SessionPayload extends JWTPayload {
  userId: string
  email: string
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'
  name: string
  isRoot: boolean
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-that-needs-to-be-at-least-32-chars-long'
const JWT_KEY = new TextEncoder().encode(JWT_SECRET)
const AUTH_BASE_URL = process.env.CI
  ? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
  : 'http://localhost:3000'

const SEEDED_ROLE_CREDENTIALS: Record<UserRole, RoleCredentials> = {
  admin: {
    role: 'admin',
    email: 'admin@eduweb.vn',
    password: 'hungcuong123',
    storageFile: 'admin.json',
  },
  teacher: {
    role: 'teacher',
    email: 'teacher.toan@eduweb.vn',
    password: 'Test@1234',
    storageFile: 'teacher.json',
  },
  student: {
    role: 'student',
    email: 'student1@eduweb.vn',
    password: 'Test@1234',
    storageFile: 'student.json',
  },
  parent: {
    role: 'parent',
    email: 'parent1@eduweb.vn',
    password: 'Test@1234',
    storageFile: 'parent.json',
  },
}

export const USER_ROLES = Object.keys(SEEDED_ROLE_CREDENTIALS) as UserRole[]

export function getRoleCredentials(role: UserRole): RoleCredentials {
  return SEEDED_ROLE_CREDENTIALS[role]
}

export function getStorageStatePath(role: UserRole): string {
  return path.join('e2e', '.auth', getRoleCredentials(role).storageFile)
}

async function getSessionPayload(role: UserRole): Promise<SessionPayload> {
  const credentials = getRoleCredentials(role)
  const user = await db.user.findUnique({
    where: { email: credentials.email },
    select: { id: true, email: true, name: true, role: true, isRoot: true },
  })

  if (!user) {
    throw new Error(`Không tìm thấy user seeded cho role ${role}: ${credentials.email}`)
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    isRoot: user.isRoot,
  }
}

export async function createAuthToken(role: UserRole): Promise<string> {
  return new SignJWT(await getSessionPayload(role))
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_KEY)
}

export async function setAuthenticatedSession(page: Page, role: UserRole): Promise<void> {
  const token = await createAuthToken(role)
  await page.context().addCookies([
    {
      name: 'session_token',
      value: token,
      url: AUTH_BASE_URL,
      httpOnly: true,
      sameSite: 'Lax',
      secure: AUTH_BASE_URL.startsWith('https://'),
      expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    },
  ])
}

export async function enableDisclaimerBypass(page: Page): Promise<void> {
  await page.context().addInitScript(
    ({ storageKey }) => {
      window.localStorage.setItem(storageKey, 'true')
    },
    { storageKey: DISCLAIMER_STORAGE_KEY },
  )
}

export async function gotoWithDisclaimerAccepted(page: Page, url: string): Promise<void> {
  await enableDisclaimerBypass(page)
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('domcontentloaded')
}

export async function loginAsRole(page: Page, role: UserRole): Promise<void> {
  const credentials = getRoleCredentials(role)

  await gotoWithDisclaimerAccepted(page, '/login')
  await page.fill('input[name="email"]', credentials.email)
  await page.fill('input[name="password"]', credentials.password)
  await page.selectOption('select[name="role"]', role)
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL(new RegExp(`/${role}(?:$|[/?#])`), {
    timeout: 10000,
  })
}

export async function newAuthenticatedPage(
  browser: Browser,
  role: UserRole,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext()
  const page = await context.newPage()

  await setAuthenticatedSession(page, role)
  await enableDisclaimerBypass(page)

  return { context, page }
}
