/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TeacherQuizManager from "@/components/TeacherQuizManager";

export const dynamic = "force-dynamic";

export default async function AdminQuizzesPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  // Fetch all quizzes created by any teacher/admin
  const quizzes = await db.quiz.findMany({
    include: {
      subject: true,
      class: true,
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { id: "desc" },
  });

  const subjects = await db.subject.findMany({
    orderBy: { name: "asc" },
  });

  const classes = await db.class.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">Quản lý đề thi toàn hệ thống (Admin)</h1>
        <p className="font-caption text-ink-muted-80 mt-1">
          Xem, chỉnh sửa, xóa và tạo mới các đề thi thử, bài trắc nghiệm công khai hoặc nội bộ lớp học.
        </p>
      </div>

      <TeacherQuizManager quizzes={quizzes as any} subjects={subjects} classes={classes} />
    </div>
  );
}
