"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { computePayment, applyCreditToPeriod } from "@/lib/tuition-utils";

export async function getFeeSettings() {
  let setting = await db.tuitionFeeSetting.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!setting) {
    setting = await db.tuitionFeeSetting.create({ data: { pricePerPeriod: 15000, updatedBy: "system" } });
  }
  return { pricePerPeriod: setting.pricePerPeriod };
}

export async function updateFeeSettings(pricePerPeriod: number) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { success: false, error: "Không có quyền" };
  await db.tuitionFeeSetting.create({ data: { pricePerPeriod, updatedBy: session.userId } });
  revalidatePath("/admin/tuition");
  return { success: true };
}

export async function calculateTuition(classId: string, fromMonth: number, toMonth: number, year: number) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { success: false, error: "Không có quyền" };

  const { pricePerPeriod } = await getFeeSettings();
  const classData = await db.class.findUnique({
    where: { id: classId },
    include: { students: { include: { user: { select: { name: true } } } } },
  });
  if (!classData) return { success: false, error: "Lớp không tồn tại" };

  const allResults: any[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const activeIds = classData.students.map((s) => s.id);

  await db.$transaction(async (tx) => {
    // Số dư trả trước hiện có theo cặp (học sinh, lớp) — map theo studentId
    const credits = await tx.studentCredit.findMany({ where: { classId } });
    const creditMap = new Map<string, number>();
    for (const c of credits) creditMap.set(c.studentId, c.credit);

    for (let month = fromMonth; month <= toMonth; month++) {
      const startDate = new Date(year, month - 1, 1);
      // Don't calculate for months entirely in the future
      if (startDate > today) continue;

      // Cap end date at today for current month
      const monthEnd = new Date(year, month, 0, 23, 59, 59);
      const endDate = monthEnd > today ? today : monthEnd;

      const schedules = await tx.schedule.findMany({
        where: { classId, date: { gte: startDate, lte: endDate } },
      });

      const schedulePeriods: Record<string, number> = {};
      for (const s of schedules) {
        if (s.date) {
          const [sh, sm] = s.startTime.split(":").map(Number);
          const [eh, em] = s.endTime.split(":").map(Number);
          schedulePeriods[s.id] = Math.max(1, Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 45));
        }
      }
      const firstSchedulePeriods = Object.values(schedulePeriods)[0] || 1;

      // KHÔNG deleteMany — giữ paid + lịch sử thanh toán khi tính lại
      const existing = await tx.tuition.findMany({ where: { classId, month, year } });
      const existingPaid = new Map<string, number>();
      for (const t of existing) existingPaid.set(t.studentId, t.paid);

      for (const student of classData.students) {
        // Logic: tính tiền cho các buổi ĐÃ điểm danh (PRESENT/ABSENT/LATE).
        // Chưa điểm danh hoặc có phép (EXCUSED) = không tính tiền.
        const attendanceRecords = await tx.attendance.findMany({
          where: { studentId: student.id, date: { gte: startDate, lte: endDate } },
        });

        // Đếm số buổi đã được điểm danh (không tính EXCUSED)
        const markedSchedules = new Set<string>();
        for (const att of attendanceRecords) {
          if (att.status !== "EXCUSED") {
            const matchingSchedule = schedules.find(
              (s) => s.date && new Date(s.date).toISOString().split("T")[0] === att.date.toISOString().split("T")[0]
            );
            if (matchingSchedule && !markedSchedules.has(matchingSchedule.id)) {
              markedSchedules.add(matchingSchedule.id);
            }
          }
        }

        const studentPeriods = markedSchedules.size * firstSchedulePeriods;
        const amount = studentPeriods * pricePerPeriod;

        const rawPrevPaid = existingPaid.get(student.id) ?? 0;
        // (a) Recalc làm amount giảm dưới paid → trả surplus về credit
        const surplus = Math.max(0, rawPrevPaid - amount);
        const prevPaid = rawPrevPaid - surplus;
        if (surplus > 0) {
          creditMap.set(student.id, (creditMap.get(student.id) ?? 0) + surplus);
        }
        // (b) Tự trừ credit vào khoản còn thiếu
        const { newPaid, creditUsed, status } = applyCreditToPeriod(amount, prevPaid, creditMap.get(student.id) ?? 0);
        if (creditUsed > 0) {
          creditMap.set(student.id, (creditMap.get(student.id) ?? 0) - creditUsed);
        }

        await tx.tuition.upsert({
          where: { studentId_classId_month_year: { studentId: student.id, classId, month, year } },
          update: { periods: studentPeriods, amount, paid: newPaid, status },
          create: { studentId: student.id, classId, month, year, periods: studentPeriods, amount, paid: newPaid, status },
        });

        allResults.push({ studentId: student.id, studentName: student.user.name, month, periods: studentPeriods, amount, markedCount: markedSchedules.size });
      }
    }

    // Cleanup row mồ côi an toàn: học sinh đã rời lớp & chưa nộp (giữ lại row đã nộp)
    await tx.tuition.deleteMany({
      where: { classId, month: { gte: fromMonth, lte: toMonth }, year, studentId: { notIn: activeIds }, paid: 0 },
    });

    // Ghi lại số dư trả trước cho từng học sinh trong lớp
    for (const [studentId, credit] of creditMap) {
      await tx.studentCredit.upsert({
        where: { studentId_classId: { studentId, classId } },
        update: { credit },
        create: { studentId, classId, credit },
      });
    }
  });

  revalidatePath(`/admin/tuition/${classId}`);
  return { success: true, data: allResults };
}

export async function getTuitionByRange(classId: string, fromMonth: number, toMonth: number, year: number) {
  return db.tuition.findMany({
    where: { classId, month: { gte: fromMonth, lte: toMonth }, year },
    include: { student: { include: { user: { select: { name: true } } } }, payments: { orderBy: { paidAt: "desc" } } },
    orderBy: [{ student: { user: { name: "asc" } } }, { month: "asc" }],
  });
}

export async function getAllClasses() {
  return db.class.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { students: true } } } });
}

export async function recordPayment(tuitionId: string, amount: number, method: string, note: string) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) return { success: false, error: "Không có quyền" };

  // TODO: nếu sau này thêm chức năng xóa/hủy payment, phải giảm credit tương ứng.
  let surplus = 0;
  let classId = "";
  try {
  await db.$transaction(async (tx) => {
    const tuition = await tx.tuition.findUnique({ where: { id: tuitionId } });
    if (!tuition) throw new Error("Không tìm thấy");
    classId = tuition.classId;

    // TEACHER chỉ được thu tiền cho lớp mình phụ trách (chủ nhiệm hoặc có dạy)
    if (session.role === "TEACHER") {
      const teacher = await tx.teacherProfile.findUnique({ where: { userId: session.userId } });
      if (!teacher) throw new Error("Không tìm thấy hồ sơ giảng viên");
      const ownsClass = await tx.class.findFirst({
        where: {
          id: tuition.classId,
          OR: [
            { formTeacherId: teacher.id },
            { schedules: { some: { teacherId: teacher.id } } },
          ],
        },
      });
      if (!ownsClass) throw new Error("Bạn không phụ trách lớp này");
    }

    await tx.tuitionPayment.create({
      data: { tuitionId, studentId: tuition.studentId, amount, paidAt: new Date(), method, note: note || null, recordedBy: session.userId },
    });
    const result = computePayment(tuition.paid, tuition.amount, amount);
    surplus = result.surplus;
    await tx.tuition.update({ where: { id: tuitionId }, data: { paid: result.effectivePaid, status: result.status } });
    if (surplus > 0) {
      await tx.studentCredit.upsert({
        where: { studentId_classId: { studentId: tuition.studentId, classId: tuition.classId } },
        update: { credit: { increment: surplus } },
        create: { studentId: tuition.studentId, classId: tuition.classId, credit: surplus },
      });
    }
  });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi hệ thống khi ghi nhận thanh toán.";
    return { success: false, error: message };
  }

  revalidatePath(`/admin/tuition/${classId}`);
  revalidatePath(`/teacher/tuition/${classId}`);
  return { success: true, surplus };
}

export async function exportTuitionCSV(classId: string, fromMonth: number, toMonth: number, year: number) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { success: false, error: "Không có quyền" };
  const classData = await db.class.findUnique({ where: { id: classId } });
  if (!classData) return { success: false, error: "Lớp không tồn tại" };
  const months = Array.from({ length: toMonth - fromMonth + 1 }, (_, i) => fromMonth + i);
  for (const m of months) await calculateTuition(classId, m, m, year);
  const tuitionList = await db.tuition.findMany({
    where: { classId, month: { gte: fromMonth, lte: toMonth }, year },
    include: { student: { include: { user: { select: { name: true } } } } },
    orderBy: [{ student: { user: { name: "asc" } } }, { month: "asc" }],
  });
  // Số dư trả trước theo cặp (học sinh, lớp) — map theo studentId
  const credits = await db.studentCredit.findMany({ where: { classId } });
  const creditMap = new Map<string, number>();
  for (const c of credits) creditMap.set(c.studentId, c.credit);

  const headers = ["Học sinh", ...months.map(m => `Tháng ${m}/${year}`), "Tổng HP", "Đã đóng", "Số dư", "Còn lại"];
  const rows: string[][] = [];
  const studentMap = new Map<string, typeof tuitionList>();
  for (const t of tuitionList) { if (!studentMap.has(t.studentId)) studentMap.set(t.studentId, []); studentMap.get(t.studentId)!.push(t); }
  for (const [, entries] of studentMap) {
    const name = entries[0].student.user.name;
    let totalOwed = 0, totalPaid = 0;
    const monthAmounts: string[] = [];
    for (const m of months) {
      const e = entries.find(x => x.month === m);
      if (e) { monthAmounts.push(e.amount.toLocaleString()); totalOwed += e.amount; totalPaid += e.paid; }
      else monthAmounts.push("0");
    }
    const credit = creditMap.get(entries[0].studentId) ?? 0;
    rows.push([name, ...monthAmounts, totalOwed.toLocaleString(), totalPaid.toLocaleString(), credit.toLocaleString(), Math.max(0, totalOwed - totalPaid - credit).toLocaleString()]);
  }
  const csv = "﻿" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
  return { success: true, csv: `data:text/csv;charset=utf-8;base64,${Buffer.from(csv, "utf-8").toString("base64")}`, filename: `hoc_phi_${classData.name}_${year}.csv` };
}

export async function toggleAbsence(dateStr: string, studentId: string, isAbsent: boolean) {
  const date = new Date(dateStr);
  if (!isAbsent) { await db.attendance.deleteMany({ where: { studentId, date } }); }
  else { await db.attendance.upsert({ where: { studentId_date: { studentId, date } }, update: { status: "ABSENT" }, create: { studentId, date, status: "ABSENT" } }); }
  return { success: true };
}
