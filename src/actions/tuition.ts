"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getFeeSettings() {
  let setting = await db.tuitionFeeSetting.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!setting) {
    setting = await db.tuitionFeeSetting.create({
      data: { pricePerPeriod: 15000, updatedBy: "system" },
    });
  }
  return { pricePerPeriod: setting.pricePerPeriod };
}

export async function updateFeeSettings(pricePerPeriod: number) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { success: false, error: "Không có quyền" };

  await db.tuitionFeeSetting.create({
    data: { pricePerPeriod, updatedBy: session.userId },
  });
  revalidatePath("/admin/tuition");
  return { success: true };
}

export async function calculateTuition(classId: string, month: number, year: number) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { success: false, error: "Không có quyền" };

  const { pricePerPeriod } = await getFeeSettings();
  const classData = await db.class.findUnique({
    where: { id: classId },
    include: { students: { include: { user: { select: { name: true } } } } },
  });
  if (!classData) return { success: false, error: "Lớp không tồn tại" };

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const schedules = await db.schedule.findMany({
    where: { classId, date: { gte: startDate, lte: endDate } },
  });

  const schedulePeriods: Record<string, number> = {};
  for (const s of schedules) {
    if (s.date) {
      const [sh, sm] = s.startTime.split(":").map(Number);
      const [eh, em] = s.endTime.split(":").map(Number);
      const minutes = (eh * 60 + em) - (sh * 60 + sm);
      schedulePeriods[s.id] = Math.max(1, Math.round(minutes / 45));
    }
  }

  const totalPeriods = Object.values(schedulePeriods).reduce((a, b) => a + b, 0);
  const scheduleCount = schedules.length;

  // Reset existing tuition for this class/month/year to prevent duplicates on re-run
  await db.tuition.deleteMany({ where: { classId, month, year } });

  const results = [];

  for (const student of classData.students) {
    const absences = await db.attendance.count({
      where: {
        studentId: student.id,
        date: { gte: startDate, lte: endDate },
        status: { in: ["EXCUSED"] },
      },
    });

    const absentPeriods = scheduleCount > 0 ? Math.round((absences / scheduleCount) * totalPeriods) : 0;
    const studentPeriods = Math.max(0, totalPeriods - absentPeriods);
    const amount = studentPeriods * pricePerPeriod;

    await db.tuition.upsert({
      where: { studentId_classId_month_year: { studentId: student.id, classId, month, year } },
      update: { periods: studentPeriods, amount },
      create: { studentId: student.id, classId, month, year, periods: studentPeriods, amount },
    });

    results.push({
      studentId: student.id,
      studentName: student.user.name,
      periods: studentPeriods,
      amount,
      absences,
    });
  }

  revalidatePath(`/admin/tuition/${classId}`);
  return { success: true, data: results };
}

export async function getTuitionByClass(classId: string, month: number, year: number) {
  return db.tuition.findMany({
    where: { classId, month, year },
    include: {
      student: { include: { user: { select: { name: true } } } },
      payments: { orderBy: { paidAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllClasses() {
  return db.class.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { students: true } } } });
}

export async function recordPayment(tuitionId: string, amount: number, method: string, note: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { success: false, error: "Không có quyền" };

  const tuition = await db.tuition.findUnique({ where: { id: tuitionId } });
  if (!tuition) return { success: false, error: "Không tìm thấy" };

  await db.tuitionPayment.create({
    data: { tuitionId, studentId: tuition.studentId, amount, paidAt: new Date(), method, note: note || null, recordedBy: session.userId },
  });

  const newPaid = tuition.paid + amount;
  const status = newPaid >= tuition.amount ? "PAID" : newPaid > 0 ? "PARTIAL" : "PENDING";
  await db.tuition.update({ where: { id: tuitionId }, data: { paid: newPaid, status } });

  revalidatePath(`/admin/tuition/${tuition.classId}`);
  return { success: true };
}

export async function calculateMultipleMonths(classId: string, months: number[], year: number) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { success: false, error: "Không có quyền" };

  for (const month of months) {
    await calculateTuition(classId, month, year);
  }

  revalidatePath(`/admin/tuition/${classId}`);
  return { success: true, totalMonths: months.length };
}

export async function exportTuitionCSV(classId: string, months: number[], year: number) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { success: false, error: "Không có quyền" };

  const classData = await db.class.findUnique({ where: { id: classId } });
  if (!classData) return { success: false, error: "Lớp không tồn tại" };

  // Ensure tuition is calculated for all requested months
  for (const month of months) {
    await calculateTuition(classId, month, year);
  }

  const tuitionList = await db.tuition.findMany({
    where: { classId, month: { in: months }, year },
    include: {
      student: { include: { user: { select: { name: true } } } },
      payments: { orderBy: { paidAt: "desc" } },
    },
    orderBy: [{ student: { user: { name: "asc" } } }, { month: "asc" }],
  });

  // Build CSV
  const headers = ["Học sinh", ...months.map(m => `Tháng ${m}/${year}`), "Tổng học phí", "Đã đóng", "Còn lại"];
  const rows: string[][] = [];
  const studentMap = new Map<string, typeof tuitionList>();

  for (const t of tuitionList) {
    if (!studentMap.has(t.studentId)) studentMap.set(t.studentId, []);
    studentMap.get(t.studentId)!.push(t);
  }

  for (const [studentId, entries] of studentMap) {
    const name = entries[0].student.user.name;
    let totalOwed = 0, totalPaid = 0;
    const monthAmounts: string[] = [];

    for (const month of months) {
      const entry = entries.find(e => e.month === month);
      if (entry) {
        monthAmounts.push(entry.amount.toLocaleString());
        totalOwed += entry.amount;
        totalPaid += entry.paid;
      } else {
        monthAmounts.push("0");
      }
    }

    rows.push([name, ...monthAmounts, totalOwed.toLocaleString(), totalPaid.toLocaleString(), (totalOwed - totalPaid).toLocaleString()]);
  }

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
  const bom = "﻿";
  const buffer = Buffer.from(bom + csvContent, "utf-8");

  return { success: true, csv: `data:text/csv;charset=utf-8;base64,${buffer.toString("base64")}`, filename: `hoc_phi_${classData.name}_${year}.csv` };
}

export async function toggleAbsence(dateStr: string, studentId: string, isAbsent: boolean) {
  const date = new Date(dateStr);
  if (!isAbsent) {
    await db.attendance.deleteMany({ where: { studentId, date } });
  } else {
    await db.attendance.upsert({
      where: { studentId_date: { studentId, date } },
      update: { status: "ABSENT" },
      create: { studentId, date, status: "ABSENT" },
    });
  }
  return { success: true };
}
