/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { getQuizFileManagerList } from "@/actions/quizzes";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TeacherQuizManager from "@/components/TeacherQuizManager";

export const dynamic = "force-dynamic";

export default async function AdminQuizzesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const result = await getQuizFileManagerList();
  let loadError = !result.success;
  let candidateQuizIds: string[] = [];
  let formattedQuizzes: any[] = [];
  let subjects: any[] = [];
  let classes: any[] = [];

  try {
    const candidateQuizzes = await db.quiz.findMany({
      where: { id: { in: (result.data ?? []).map(q => q.id) }, candidateAccessRequired: true },
      select: { id: true },
    });
    candidateQuizIds = candidateQuizzes.map(q => q.id);

    // Fetch all quizzes created by any teacher/admin
    const quizzes = edit ? await db.quiz.findMany({
      where: { id: edit },
      include: {
        subject: true,
        class: true,
        assignments: { include: { class: true } },
        questions: true,
        submissions: {
          select: { score: true },
        },
        teacher: {
          include: {
            user: { select: { name: true } }
          }
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { id: "desc" },
    }) : [];

    subjects = await db.subject.findMany({
      orderBy: { name: "asc" },
    });

    classes = await db.class.findMany({
      orderBy: { name: "asc" },
    });

    formattedQuizzes = quizzes.map((q) => ({
      ...q,
      creatorName: null
    }));
    if (edit && formattedQuizzes.length === 0) loadError = true;
  } catch (error) {
    loadError = true;
    console.error("Prisma error in AdminQuizzesPage:", error);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">Quản lý đề thi toàn hệ thống (Admin)</h1>
        <p className="font-caption text-ink-muted-80 mt-1">
          Xem, chỉnh sửa, xóa và tạo mới các đề thi thử, bài trắc nghiệm công khai hoặc nội bộ lớp học.
        </p>
      </div>

      <TeacherQuizManager candidateQuizIds={candidateQuizIds} key={edit ?? "list"} editQuiz={formattedQuizzes[0] ? JSON.parse(JSON.stringify(formattedQuizzes[0])) : undefined} listLoadError={loadError} subjectsLoadError={loadError} quizzes={(result.data ?? []) as any} subjects={subjects} classes={classes} isAdmin={true} />
    </div>
  );
}
