import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DollarSign, ChevronRight, Users } from "lucide-react";

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

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">Học phí của tôi</h1>
        <p className="font-caption text-ink-muted-80 mt-1">
          Học phí thu được từ các lớp bạn chủ nhiệm hoặc giảng dạy.
        </p>
      </div>

      <div className="bg-canvas border border-hairline rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-divider-soft">
          <span className="text-xs font-bold text-ink-muted-48 uppercase tracking-wider">
            Danh sách lớp phụ trách ({classes.length})
          </span>
        </div>
        {classes.length === 0 ? (
          <div className="p-16 text-center">
            <DollarSign className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
            <p className="font-body text-ink-muted-80">Bạn chưa được phân công lớp nào.</p>
          </div>
        ) : (
          classes.map((cls) => {
            const agg = aggMap.get(cls.id) || { amount: 0, paid: 0 };
            const remaining = Math.max(0, agg.amount - agg.paid);
            return (
              <Link
                key={cls.id}
                href={`/teacher/tuition/${cls.id}`}
                className="flex flex-wrap items-center justify-between px-5 py-4 border-b border-divider-soft last:border-0 hover:bg-surface-pearl/50 transition-colors gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-ink">{cls.name}</span>
                  <span className="text-[11px] text-ink-muted-48 flex items-center gap-1">
                    <Users className="h-3 w-3" /> {cls._count.students} HS
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-ink-muted-80">
                    Đã thu: <strong className="text-green-700">{agg.paid.toLocaleString()}đ</strong>
                  </span>
                  <span className="text-ink-muted-80">
                    Còn lại: <strong className="text-orange-600">{remaining.toLocaleString()}đ</strong>
                  </span>
                  <ChevronRight className="h-4 w-4 text-ink-muted-48" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
