import { vi } from "vitest";

// Provide test secrets so utilities relying on secure configuration work in unit tests
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-at-least-32-chars-long-for-vitest-suite";
process.env.QUIZ_CANDIDATE_ENCRYPTION_KEY = process.env.QUIZ_CANDIDATE_ENCRYPTION_KEY || "test-candidate-encryption-key-32-bytes";
process.env.IMGBB_API_KEY = process.env.IMGBB_API_KEY || "test-imgbb-api-key";

// Mock getSession and revalidatePath globally for Vitest tests
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock the global db instance to prevent Vitest from hitting the actual DB
export const mockDb = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  calendar: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  event: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  attendance: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
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
    deleteMany: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  quiz: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
  },
  quizClassAssignment: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
  },
  question: {
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  quizAttempt: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    findFirst: vi.fn(),
  },
  quizCandidate: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  quizSubmission: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  studentProfile: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  grade: {
    create: vi.fn(),
    upsert: vi.fn(),
  },
  class: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(async (arg) => {
    if (typeof arg === "function") {
      const tx = { ...mockDb, $executeRaw: vi.fn(), $queryRaw: vi.fn() };
      return arg(tx);
    }
    return Promise.all(arg);
  }),
};

vi.mock("@/lib/db", () => {
  return {
    db: mockDb,
  };
});
