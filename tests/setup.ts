import { vi } from 'vitest'

// Mock getSession and revalidatePath globally for Vitest tests
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock the global db instance to prevent Vitest from hitting the actual DB
export const mockDb = {
  room: {
    findFirst: vi.fn(),
  },
  schedule: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  homeworkSubmission: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(async (arg) => {
    if (typeof arg === 'function') {
      return arg(mockDb)
    }
    return Promise.all(arg)
  }),
}

vi.mock('@/lib/db', () => {
  return {
    db: mockDb,
  }
})
