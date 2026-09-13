import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const legacyQuizzes = await prisma.quiz.findMany({
    where: { classId: { not: null } },
    select: {
      id: true,
      classId: true,
      deadline: true,
    },
  });

  let created = 0;
  let skipped = 0;

  for (const quiz of legacyQuizzes) {
    if (!quiz.classId) {
      skipped += 1;
      continue;
    }

    const existing = await prisma.quizClassAssignment.findUnique({
      where: {
        quizId_classId: {
          quizId: quiz.id,
          classId: quiz.classId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.quizClassAssignment.create({
      data: {
        quizId: quiz.id,
        classId: quiz.classId,
        deadlineOverride: quiz.deadline,
      },
    });
    created += 1;
  }

  console.log(`QuizClassAssignment backfill complete: created=${created}, skipped=${skipped}`);
}

main()
  .catch((error: unknown) => {
    console.error("QuizClassAssignment backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
