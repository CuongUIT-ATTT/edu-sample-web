import { defineConfig, devices } from '@playwright/test'

const isCI = Boolean(process.env.CI)
const baseURL = isCI
  ? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
  : 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Auth setup — chạy trước tất cả
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // Desktop browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-gpu', '--disable-software-rasterizer']
        }
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },

    // Mobile
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
      dependencies: ['setup'],
    },
  ],

  // Local luôn chạy trên dev server localhost với env test; CI tự build/start server riêng.
  webServer: isCI ? undefined : {
    command: `node -e "require('dotenv').config({ path: '.env.test' }); require('child_process').spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: true, env: process.env })"`,
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
