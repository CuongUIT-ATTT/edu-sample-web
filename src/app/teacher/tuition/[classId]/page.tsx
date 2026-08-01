import React from "react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ClassTuitionDetail from "@/app/admin/tuition/[classId]/ClassTuitionDetail";

export const dynamic = "force-dynamic";

export default async function TeacherClassTuitionPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ from?: string; to?: string; year?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") redirect("/login");

  const teacherProfile = await db.teacherProfile.findUnique({
    where: { userId: session.userId },
  });
  if (!teacherProfile) redirect("/login");

  const { classId } = await params;
  const sp = await searchParams;
  const fromMonth = parseInt(sp.from || String(new Date().getMonth() + 1));
  const toMonth = parseInt(sp.to || String(new Date().getMonth() + 1));
  const year = parseInt(sp.year || String(new Date().getFullYear()));

  // Verify giáo viên phụ trách lớp này
  const classData = await db.class.findFirst({
    where: {
      id: classId,
      OR: [
        { formTeacherId: teacherProfile.id },
        { schedules: { some: { teacherId: teacherProfile.id } } },
      ],
    },
    include: { _count: { select: { students: true } } },
  });
  if (!classData) redirect("/teacher/tuition");

  const tuitionList = await db.tuition.findMany({
    where: { classId, month: { gte: fromMonth, lte: toMonth }, year },
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          credits: { where: { classId } },
        },
      },
      payments: { orderBy: { paidAt: "desc" } },
    },
    orderBy: [{ student: { user: { name: "asc" } } }, { month: "asc" }],
  });

  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const schedules = await db.schedule.findMany({
    where: { classId, date: { gte: new Date(year, fromMonth - 1, 1), lte: todayEnd } },
    orderBy: { date: "asc" },
  });

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/teacher/tuition" className="h-8 w-8 rounded-lg border border-hairline flex items-center justify-center hover:bg-surface-pearl transition-colors">
          <ArrowLeft className="h-4 w-4 text-ink-muted-48" />
        </Link>
        <div>
          <h1 className="font-tagline text-2xl font-semibold text-ink">Học phí lớp {classData.name}</h1>
          <p className="font-caption text-ink-muted-80 mt-1">
            Tháng {fromMonth === toMonth ? fromMonth : `${fromMonth}→${toMonth}`}/{year} • {classData._count.students} HS • {schedules.length} buổi
          </p>
        </div>
      </div>
      <ClassTuitionDetail
        classId={classId}
        fromMonth={fromMonth}
        toMonth={toMonth}
        year={year}
        initialTuition={JSON.parse(JSON.stringify(tuitionList))}
        schedules={JSON.parse(JSON.stringify(schedules))}
      />
    </div>
  );
}
