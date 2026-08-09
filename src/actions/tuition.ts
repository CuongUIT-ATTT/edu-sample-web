"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { computePayment, applyCreditToPeriod } from "@/lib/tuition-utils";
import { teacherOwnsClass } from "@/lib/teacher-classes";
import { expandSeriesToInstances, normalizeDateUtc, dateToUtcStr, toLocalDateStr } from "@/lib/schedule-expand";

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
  const fromStart = new Date(year, fromMonth - 1, 1); // mốc bắt đầu cho toàn kỳ (ATTENDANCE window — local)
  const expandFrom = new Date(Date.UTC(year, fromMonth - 1, 1)); // EXPAND SERIES window — UTC midnight (pattern admin tuition page)

  await db.$transaction(async (tx) => {
    // ── A. ĐỌC HÀNG LOẠT: 1 query cho cả kỳ, không query trong vòng lặp ──
    // Lịch mới: expand ScheduleSeries → instances trong [expandFrom, normalizeDateUtc(today)].
    // KHÔNG dùng bảng Schedule cũ (không còn được tạo dữ liệu) — nó luôn rỗng → amount=0.
    const seriesList = await tx.scheduleSeries.findMany({ where: { classId }, include: { exceptions: true } });
    const instances = seriesList.flatMap((s) =>
      expandSeriesToInstances(s, s.exceptions, expandFrom, normalizeDateUtc(today))
    );
    // Attendance window giữ LOCAL (fromStart/today) — attendance lưu local midnight.
    const attendanceRecords = await tx.attendance.findMany({
      where: { studentId: { in: activeIds }, date: { gte: fromStart, lte: today } },
    });
    const tuitionRows = await tx.tuition.findMany({ where: { classId, month: { gte: fromMonth, lte: toMonth }, year } });
    const credits = await tx.studentCredit.findMany({ where: { classId } });

    // Số dư trả trước hiện có theo cặp (học sinh, lớp) — map theo studentId
    const creditMap = new Map<string, number>();
    for (const c of credits) creditMap.set(c.studentId, c.credit);

    // Số tiết của TỪNG buổi học — key tổng hợp `${seriesId}-${dateToUtcStr(instanceDate)}` (giống ClassTuitionDetail).
    const schedulePeriodsById = new Map<string, number>();
    for (const inst of instances) {
      const [sh, sm] = inst.startTime.split(":").map(Number);
      const [eh, em] = inst.endTime.split(":").map(Number);
      schedulePeriodsById.set(
        `${inst.seriesId}-${dateToUtcStr(inst.instanceDate)}`,
        Math.max(1, Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 45))
      );
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

      // Lọc instances trong cửa sổ tháng này — so bằng date string "YYYY-MM-DD" (timezone-proof).
      const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
      const monthInstances = instances.filter((inst) => dateToUtcStr(inst.instanceDate).startsWith(monthPrefix));
      // Map ngày → instance (giữ instance đầu tiên của ngày — expand đảm bảo 1 instance/ngày)
      const instanceByDate = new Map<string, (typeof monthInstances)[number]>();
      for (const inst of monthInstances) {
        const d = dateToUtcStr(inst.instanceDate);
        if (!instanceByDate.has(d)) instanceByDate.set(d, inst);
      }

      for (const student of classData.students) {
        // Logic: tính tiền cho các buổi ĐÃ điểm danh (PRESENT/ABSENT/LATE).
        // Chưa điểm danh hoặc có phép (EXCUSED) = không tính tiền.
        const atts = attendanceByStudent.get(student.id) ?? [];
        const markedSchedules = new Set<string>();
        for (const att of atts) {
          if (att.status === "EXCUSED") continue;
          if (!(att.date >= startDate && att.date <= endDate)) continue;
          // JOIN attendance → instance bằng LOCAL DATE (att.date là local midnight → toLocalDateStr).
          // KHÔNG dùng toISOString()/normalizeDateUtc(att.date) — lệch 1 ngày ở TZ +07.
          const inst = instanceByDate.get(toLocalDateStr(att.date));
          if (inst) markedSchedules.add(`${inst.seriesId}-${dateToUtcStr(inst.instanceDate)}`);
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

/**
 * Chi tiết học phí theo TỪNG BUỔI học của 1 học sinh trong 1 tháng.
 * Dành cho STUDENT (xem học phí mình) và PARENT (xem học phí con mình) —
 * có ownership check ở server, KHÔNG phơi dữ liệu cho học sinh khác.
 * Không dùng /api/attendance (route đó chưa check quyền → lộ attendance người khác).
 */
export interface TuitionDetailRow {
  date: string; // "YYYY-MM-DD" (UTC của instance)
  startTime: string;
  endTime: string;
  room: string | null;
  subjectName: string;
  periods: number;
  status: string; // PRESENT | ABSENT | LATE | EXCUSED | "N/A"
}

export async function getTuitionDetail(
  studentId: string,
  classId: string,
  month: number,
  year: number,
): Promise<{ success: boolean; error?: string; rows?: TuitionDetailRow[]; totalPeriods?: number; amount?: number; feePerPeriod?: number }> {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "PARENT")) {
    return { success: false, error: "Không có quyền xem chi tiết học phí." };
  }

  try {
    // Ownership: STUDENT → chỉ chính mình; PARENT → chỉ con của mình.
    if (session.role === "STUDENT") {
      const student = await db.studentProfile.findUnique({ where: { userId: session.userId } });
      if (!student || student.id !== studentId) {
        return { success: false, error: "Bạn không có quyền xem chi tiết học phí này." };
      }
    } else {
      const parent = await db.parentProfile.findUnique({
        where: { userId: session.userId },
        include: { students: { select: { id: true } } },
      });
      if (!parent || !parent.students.some((s) => s.id === studentId)) {
        return { success: false, error: "Bạn không có quyền xem chi tiết học phí này." };
      }
    }

    // Expand ScheduleSeries → instances trong tháng (pattern admin tuition page).
    const seriesList = await db.scheduleSeries.findMany({
      where: { classId },
      include: { subject: true, exceptions: true },
    });
    const fromUtc = new Date(Date.UTC(year, month - 1, 1));
    const toUtc = new Date(Date.UTC(year, month, 0)); // ngày cuối tháng UTC midnight
    const instances = seriesList.flatMap((s) =>
      expandSeriesToInstances(s, s.exceptions, fromUtc, toUtc)
    );
    instances.sort((a, b) => a.instanceDate.getTime() - b.instanceDate.getTime());

    // Subject name: instance.subjectId đã merge exception override (có thể khác series).
    // Gom tập subjectId → 1 query map, tránh O(n²) lookup trong vòng lặp.
    const subjectIds = new Set<string>();
    for (const inst of instances) subjectIds.add(inst.subjectId);
    const subjects = await db.subject.findMany({ where: { id: { in: [...subjectIds] } } });
    const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));

    // Attendance của học sinh trong tháng (local window — attendance lưu local midnight).
    const fromLocal = new Date(year, month - 1, 1);
    const toLocal = new Date(year, month, 0, 23, 59, 59);
    const atts = await db.attendance.findMany({
      where: { studentId, date: { gte: fromLocal, lte: toLocal } },
    });
    const statusByDate = new Map<string, string>();
    for (const a of atts) statusByDate.set(toLocalDateStr(a.date), a.status);

    const rows: TuitionDetailRow[] = instances.map((inst) => {
      const [sh, sm] = inst.startTime.split(":").map(Number);
      const [eh, em] = inst.endTime.split(":").map(Number);
      const periods = Math.max(1, Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 45));
      const dateStr = dateToUtcStr(inst.instanceDate);
      return {
        date: dateStr,
        startTime: inst.startTime,
        endTime: inst.endTime,
        room: inst.room,
        subjectName: subjectNameById.get(inst.subjectId) ?? "—",
        periods,
        status: statusByDate.get(dateStr) ?? "N/A",
      };
    });

    // Tổng tiết = tổng tiết các buổi ĐÃ điểm danh (khác N/A) — khớp logic calculateTuition.
    const totalPeriods = rows
      .filter((r) => r.status !== "N/A" && r.status !== "EXCUSED")
      .reduce((sum, r) => sum + r.periods, 0);
    const tuition = await db.tuition.findFirst({
      where: { studentId, classId, month, year },
    });
    const amount = tuition?.amount ?? 0;
    const feePerPeriod = totalPeriods > 0 ? Math.round(amount / totalPeriods) : 0;

    return { success: true, rows, totalPeriods, amount, feePerPeriod };
  } catch (error) {
    console.error("getTuitionDetail error:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi tải chi tiết học phí." };
  }
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
            { scheduleSeries: { some: { teacherId: teacher.id } } },
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
