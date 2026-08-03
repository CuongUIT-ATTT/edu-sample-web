import React from "react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TuitionClassList from "@/components/TuitionClassList";

export const dynamic = "force-dynamic";

export default async function TeacherTuitionPage() {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") redirect("/login");

  const teacherProfile = await db.teacherProfile.findUnique({
    where: { userId: session.userId },
  });
  if (!teacherProfile) redirect("/login");

  // Lớp giáo viên phụ trách: chủ nhiệm HOẶC có dạy
  const taughtClasses = await db.class.findMany({
    where: {
      OR: [
        { formTeacherId: teacherProfile.id },
        { schedules: { some: { teacherId: teacherProfile.id } } },
      ],
    },
    select: { id: true },
  });
  const teacherClassIds = taughtClasses.map((c) => c.id);

  const classes = await db.class.findMany({
    where: { id: { in: teacherClassIds } },
    include: { _count: { select: { students: true } } },
    orderBy: { name: "asc" },
  });

  // Tổng học phí theo từng lớp (tất cả tháng)
  const aggregates = await db.tuition.groupBy({
    by: ["classId"],
    where: { classId: { in: teacherClassIds } },
    _sum: { amount: true, paid: true },
  });
  const aggMap = new Map<string, { amount: number; paid: number }>();
  for (const a of aggregates) {
    aggMap.set(a.classId, { amount: a._sum.amount ?? 0, paid: a._sum.paid ?? 0 });
  }
  const classList = classes.map((cls) => {
    const agg = aggMap.get(cls.id) || { amount: 0, paid: 0 };
    return { ...cls, amount: agg.amount, paid: agg.paid };
  });

  const setting = await db.tuitionFeeSetting.findFirst({ orderBy: { updatedAt: "desc" } });
  const pricePerPeriod = setting?.pricePerPeriod ?? 15000;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">Học phí của tôi</h1>
        <p className="font-caption text-ink-muted-80 mt-1">
          Học phí thu được từ các lớp bạn chủ nhiệm hoặc giảng dạy.
        </p>
      </div>

      <TuitionClassList classes={classList} initialPrice={pricePerPeriod} canEditPrice={false} tuitionPath="/teacher/tuition" />
    </div>
  );
}
