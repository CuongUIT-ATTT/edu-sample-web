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

// TEACHER chỉ được quản lý học phí cho lớp mình phụ trách (chủ nhiệm hoặc có dạy)
async function teacherOwnsClass(userId: string, classId: string): Promise<boolean> {
  const teacher = await db.teacherProfile.findUnique({ where: { userId } });
  if (!teacher) return false;
  const cls = await db.class.findFirst({
    where: {
      id: classId,
      OR: [
        { formTeacherId: teacher.id },
        { schedules: { some: { teacherId: teacher.id } } },
      ],
    },
  });
  return !!cls;
}

export async function calculateTuition(classId: string, fromMonth: number, toMonth: number, year: number) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) return { success: false, error: "Không có quyền" };

  if (session.role === "TEACHER") {
    if (!(await teacherOwnsClass(session.userId, classId))) return { success: false, error: "Bạn không phụ trách lớp này" };
  }

  const { pricePerPeriod } = await getFeeSettings();
  const classData = await db.class.findUnique({
    where: { id: classId },
    include: { students: { include: { user: { select: { name: true } } } } },
  });
  if (!classData) return { success: false, error: "Lớp không tồn tại" };

  const allResults: { studentId: string; studentName: string; month: number; periods: number; amount: number; markedCount: number }[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const activeIds = classData.students.map((s) => s.id);
  const fromStart = new Date(year, fromMonth - 1, 1); // mốc bắt đầu cho toàn kỳ

  await db.$transaction(async (tx) => {
    // ── A. ĐỌC HÀNG LOẠT: 1 query cho cả kỳ, không query trong vòng lặp ──
    const schedules = await tx.schedule.findMany({ where: { classId, date: { gte: fromStart, lte: today } } });
    const attendanceRecords = await tx.attendance.findMany({
      where: { studentId: { in: activeIds }, date: { gte: fromStart, lte: today } },
    });
    const tuitionRows = await tx.tuition.findMany({ where: { classId, month: { gte: fromMonth, lte: toMonth }, year } });
    const credits = await tx.studentCredit.findMany({ where: { classId } });

    // Số dư trả trước hiện có theo cặp (học sinh, lớp) — map theo studentId
    const creditMap = new Map<string, number>();
    for (const c of credits) creditMap.set(c.studentId, c.credit);

    // Số tiết của TỪNG buổi học (theo schedule id) — dùng cho fix tính tiết theo từng buổi
    const schedulePeriodsById = new Map<string, number>();
    for (const s of schedules) {
      if (s.date) {
        const [sh, sm] = s.startTime.split(":").map(Number);
        const [eh, em] = s.endTime.split(":").map(Number);
        schedulePeriodsById.set(s.id, Math.max(1, Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 45)));
      }
    }

    // Điểm danh gom theo học sinh → tra cứu O(1) khi xử lý từng học sinh
    const attendanceByStudent = new Map<string, (typeof attendanceRecords)[number][]>();
    for (const a of attendanceRecords) {
      const list = attendanceByStudent.get(a.studentId) ?? [];
      list.push(a);
      attendanceByStudent.set(a.studentId, list);
    }

    // Row tuition hiện có theo (studentId, month) → phục vụ so sánh update có chọn lọc
    const existingByKey = new Map<string, (typeof tuitionRows)[number]>();
    for (const t of tuitionRows) existingByKey.set(`${t.studentId}:${t.month}`, t);

    const isoDate = (d: Date) => d.toISOString().split("T")[0];

    interface TuitionWrite {
      where: { studentId_classId_month_year: { studentId: string; classId: string; month: number; year: number } };
      data: { periods: number; amount: number; paid: number; status: string };
    }
    interface TuitionCreateInput {
      studentId: string;
      classId: string;
      month: number;
      year: number;
      periods: number;
      amount: number;
      paid: number;
      status: string;
    }
    const toCreate: TuitionCreateInput[] = [];
    const toUpdate: TuitionWrite[] = [];

    for (let month = fromMonth; month <= toMonth; month++) {
      const startDate = new Date(year, month - 1, 1);
      // Không tính tháng hoàn toàn trong tương lai
      if (startDate > today) continue;

      // Cap ngày cuối tại hôm nay cho tháng hiện tại
      const monthEnd = new Date(year, month, 0, 23, 59, 59);
      const endDate = monthEnd > today ? today : monthEnd;

      // Lọc schedules trong cửa sổ tháng này — dữ liệu đã nạp sẵn, không query DB
      const monthSchedules = schedules.filter((s) => s.date && s.date >= startDate && s.date <= endDate);
      // Map ngày → schedule (giữ schedule đầu tiên, khớp với schedules.find() trước đây)
      const scheduleByDate = new Map<string, (typeof monthSchedules)[number]>();
      for (const s of monthSchedules) {
        const d = isoDate(s.date!);
        if (!scheduleByDate.has(d)) scheduleByDate.set(d, s);
      }

      for (const student of classData.students) {
        // Logic: tính tiền cho các buổi ĐÃ điểm danh (PRESENT/ABSENT/LATE).
        // Chưa điểm danh hoặc có phép (EXCUSED) = không tính tiền.
        const atts = attendanceByStudent.get(student.id) ?? [];
        const markedSchedules = new Set<string>();
        for (const att of atts) {
          if (att.status === "EXCUSED") continue;
          if (!(att.date >= startDate && att.date <= endDate)) continue;
          const matchingSchedule = scheduleByDate.get(isoDate(att.date));
          if (matchingSchedule && !markedSchedules.has(matchingSchedule.id)) {
            markedSchedules.add(matchingSchedule.id);
          }
        }

        // Fix C: tổng tiết = tổng số tiết của TỪNG buổi đã điểm danh
        // (trước đây lấy số tiết của buổi đầu tiên áp cho mọi buổi → sai khi buổi dài ngắn khác nhau)
        let studentPeriods = 0;
        for (const sid of markedSchedules) studentPeriods += schedulePeriodsById.get(sid) ?? 1;
        const amount = studentPeriods * pricePerPeriod;

        const key = `${student.id}:${month}`;
        const prev = existingByKey.get(key);
        const rawPrevPaid = prev?.paid ?? 0;
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

        // KHÔNG delete — giữ paid + lịch sử thanh toán khi tính lại.
        // Gom ghi: dòng mới → createMany; dòng cũ chỉ update khi giá trị THỰC SỰ thay đổi.
        if (!prev) {
          toCreate.push({
            studentId: student.id,
            classId,
            month,
            year,
            periods: studentPeriods,
            amount,
            paid: newPaid,
            status,
          });
        } else if (prev.periods !== studentPeriods || prev.amount !== amount || prev.paid !== newPaid || prev.status !== status) {
          toUpdate.push({
            where: { studentId_classId_month_year: { studentId: student.id, classId, month, year } },
            data: { periods: studentPeriods, amount, paid: newPaid, status },
          });
        }

        allResults.push({ studentId: student.id, studentName: student.user.name, month, periods: studentPeriods, amount, markedCount: markedSchedules.size });
      }
    }

    // ── B. GHI HÀNG LOẠT ──
    if (toCreate.length > 0) {
      await tx.tuition.createMany({ data: toCreate, skipDuplicates: true });
    }
    await Promise.all(toUpdate.map((u) => tx.tuition.update(u)));

    // Cleanup row mồ côi an toàn: học sinh đã rời lớp & chưa nộp (giữ lại row đã nộp)
    await tx.tuition.deleteMany({
      where: { classId, month: { gte: fromMonth, lte: toMonth }, year, studentId: { notIn: activeIds }, paid: 0 },
    });

    // Ghi lại số dư trả trước — tách create/update để gom batch
    const creditToCreate: { studentId: string; classId: string; credit: number }[] = [];
    const creditToUpdate: { where: { studentId_classId: { studentId: string; classId: string } }; data: { credit: number } }[] = [];
    for (const [studentId, credit] of creditMap) {
      const existing = credits.find((c) => c.studentId === studentId);
      if (existing) {
        if (existing.credit !== credit) {
          creditToUpdate.push({ where: { studentId_classId: { studentId, classId } }, data: { credit } });
        }
      } else {
        creditToCreate.push({ studentId, classId, credit });
      }
    }
    if (creditToCreate.length > 0) {
      await tx.studentCredit.createMany({ data: creditToCreate, skipDuplicates: true });
    }
    await Promise.all(creditToUpdate.map((u) => tx.studentCredit.update(u)));
  });

  revalidatePath(`/admin/tuition/${classId}`);
  revalidatePath(`/teacher/tuition/${classId}`);
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
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) return { success: false, error: "Không có quyền" };

  if (session.role === "TEACHER") {
    if (!(await teacherOwnsClass(session.userId, classId))) return { success: false, error: "Bạn không phụ trách lớp này" };
  }

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
