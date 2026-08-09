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
  scheduleSeries: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  scheduleException: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  homeworkSubmission: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  quiz: {
    findUnique: vi.fn(),
  },
  quizSubmission: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  studentProfile: {
    findUnique: vi.fn(),
  },
  grade: {
    create: vi.fn(),
    upsert: vi.fn(),
  },
  class: {
    findUnique: vi.fn(),
  },
  paymentLink: {
    findUnique: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  tuition: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  tuitionPayment: {
    create: vi.fn(),
  },
  studentCredit: {
    upsert: vi.fn(),
  },
  teacherProfile: {
    findFirst: vi.fn(),
  },
  $transaction: vi.fn(async (arg) => {
    if (typeof arg === 'function') {
      const tx = { ...mockDb, $executeRaw: vi.fn(), $queryRaw: vi.fn() }
      return arg(tx)
    }
    return Promise.all(arg)
  }),
}

vi.mock('@/lib/db', () => {
  return {
    db: mockDb,
  }
})
