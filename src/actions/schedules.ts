/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { teacherOwnsClass } from "@/lib/teacher-classes";
import {
  expandSeriesToInstances,
  normalizeDateUtc,
  dateToUtcStr,
  CONFLICT_CHECK_WINDOW_DAYS,
  type SeriesLike,
} from "@/lib/schedule-expand";

// ─── Types ───────────────────────────────────────────────────────────

export type UpdateMode = "ONLY_THIS" | "ALL_FUTURE" | "ALL";

export interface CreateScheduleInput {
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  ignoreWarning?: boolean;

  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (absent = vô hạn)
}

export interface UpdateScheduleInput {
  seriesId: string;
  instanceDate: string; // YYYY-MM-DD — ngày đang sửa (chỉ dùng cho ONLY_THIS)
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  endDate?: string | null; // null = vô hạn (mode ALL / ALL_FUTURE)
  updateMode: UpdateMode;
  ignoreWarning?: boolean;
}

export interface DeleteScheduleInput {
  seriesId: string;
  instanceDate: string; // YYYY-MM-DD
  deleteMode: "ONLY_THIS" | "ALL_FUTURE";
}

// ─── Helpers ─────────────────────────────────────────────────────────

function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(":").map(Number);
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return -1;
  return parts[0] * 60 + parts[1];
}

/** Ngày (YYYY-MM-DD hoặc Date) → Date UTC midnight. */
function toUtc(input: string | Date): Date {
  return normalizeDateUtc(input);
}

/** Cộng/trừ số ngày (giữ UTC-midnight). */
function addDaysUtc(d: Date, days: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}

/** Băm string → bigint (đúng kiểu pg_advisory_xact_lock), ổn định, không âm. */
function hashToBigInt(s: string): string {
  // FNV-1a 32-bit → nhân thêm chiều dài để giảm xung đột. Ép về [0, 2^53) an toàn cho bigint.
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const base = BigInt(h >>> 0);
  const len = BigInt(s.length);
  const combined = (base * BigInt(1000003) + len) % BigInt(Number.MAX_SAFE_INTEGER);
  return combined.toString();
}

/**
 * Acquire pg_advisory_xact_lock theo nhiều key, sort để chống deadlock.
 * Dùng `tx.$executeRaw` — chạy trong chính transaction của Prisma, nên lock được giữ
 * tới khi transaction commit (atomic với các thao tác Prisma khác trong tx).
 *
 * QUAN TRỌNG: dedup các key trước khi lock. `pg_advisory_xact_lock` KHÔNG reentrant
 * trong cùng transaction — lock cùng 1 key 2 lần trong cùng tx → lần 2 chờ lần 1
 * (chỉ release khi tx xong) → self-deadlock treo vô hạn. Hash có thể trùng (collision)
 * giữa các key khác nhau, hoặc cùng key xuất hiện nhiều ngày → phải dedup.
 */
async function acquireAdvisoryLocks(tx: any, keys: { kind: string; label: string; date: Date }[]): Promise<void> {
  const seen = new Set<string>();
  const unique: { kind: string; label: string; date: Date }[] = [];
  for (const k of keys) {
    const raw = `${k.kind}:${k.label}:${dateToUtcStr(k.date)}`;
    if (!seen.has(raw)) {
      seen.add(raw);
      unique.push(k);
    }
  }
  // Dedup theo hash lần nữa — 2 key khác nhau có thể băm trùng → lock cùng key 2 lần = self-deadlock.
  const hashSeen = new Set<string>();
  const uniqueByHash: { kind: string; label: string; date: Date }[] = [];
  for (const k of unique) {
    const h = hashToBigInt(`${k.kind}:${k.label}:${dateToUtcStr(k.date)}`);
    if (!hashSeen.has(h)) {
      hashSeen.add(h);
      uniqueByHash.push(k);
    }
  }
  const sorted = [...uniqueByHash].sort((a, b) => {
    const ka = `${a.kind}|${a.label}|${dateToUtcStr(a.date)}`;
    const kb = `${b.kind}|${b.label}|${dateToUtcStr(b.date)}`;
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  for (const k of sorted) {
    const hash = hashToBigInt(`${k.kind}:${k.label}:${dateToUtcStr(k.date)}`);
    // pg_advisory_xact_lock trả void → cast ::text để Prisma deserialize được (không treo/không lỗi)
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(${hash}::bigint)::text`;
  }
}

interface LoadedSeries {
  series: SeriesLike & { class: any; subject: any; teacher: any };
  instances: ReturnType<typeof expandSeriesToInstances>;
}

/** Load series cùng dayOfWeek trong window (loại trừ 1 số seriesId), expand runtime. Dùng `tx` để chạy trong transaction. */
async function loadInstancesForConflictCheck(
  tx: any,
  opts: {
    dayOfWeek: number;
    fromDate: Date;
    toDate: Date;
    excludeSeriesIds?: string[];
  }
): Promise<LoadedSeries[]> {
  const where: any = { dayOfWeek: opts.dayOfWeek };
  if (opts.excludeSeriesIds?.length) where.id = { notIn: opts.excludeSeriesIds };

  const series = await tx.scheduleSeries.findMany({
    where,
    include: {
      class: { include: { students: { include: { user: true } } } },
      subject: true,
      teacher: { include: { user: true } },
      exceptions: true,
    },
  });

  return series.map((s: any) => ({
    series: s as any,
    instances: expandSeriesToInstances(s, s.exceptions, opts.fromDate, opts.toDate),
  }));
}

/**
 * Check 4 cấp conflict giữa 1 instance mới và các instance hiện có.
 * - Cấp 1/2/3 (phòng/GV/lớp): block → return { error }.
 * - Cấp 4 (trùng học sinh): warning → return { isWarning: true } nếu !ignoreWarning.
 */
function findConflicts(
  newInstance: any,
  existing: LoadedSeries[],
  isTeacher: boolean,
  currentTeacherProfileId: string,
  ignoreWarning: boolean,
  label: string,
  candidateStudents: any[] = []
): { success?: boolean; error?: string; isWarning?: boolean } | null {
  const newStart = parseTimeToMinutes(newInstance.startTime);
  const newEnd = parseTimeToMinutes(newInstance.endTime);
  const newRoom = (newInstance.room || "").toLowerCase();

  for (const loaded of existing) {
    for (const inst of loaded.instances) {
      if (inst.seriesId === newInstance.seriesId && dateToUtcStr(inst.instanceDate) === dateToUtcStr(newInstance.instanceDate)) {
        continue; // chính instance đang sửa
      }
      const exStart = parseTimeToMinutes(inst.startTime);
      const exEnd = parseTimeToMinutes(inst.endTime);
      if (!((newStart < exEnd) && (newEnd > exStart))) continue; // không trùng giờ

      const formatConflictMsg = (conflictType: string) => {
        const dateLabel = ` ngày ${dateToUtcStr(inst.instanceDate)}`;
        if (!isTeacher || inst.teacherId === currentTeacherProfileId) {
          return `TRÙNG LỊCH HỌC (${conflictType}): Lớp ${loaded.series.class.name} (${inst.startTime} - ${inst.endTime}, môn ${loaded.series.subject.name}, GV: ${loaded.series.teacher.user.name}) đang diễn ra tại Phòng ${inst.room}${dateLabel}.`;
        } else {
          return `TRÙNG LỊCH HỌC (${conflictType}): Đang có ca học khác bận trong khoảng thời gian (${inst.startTime} - ${inst.endTime}) tại Phòng ${inst.room}${dateLabel}.`;
        }
      };

      // A. Same room
      if (newRoom === (inst.room || "").toLowerCase()) {
        return { success: false, error: formatConflictMsg("Trùng phòng học") };
      }
      // B. Same teacher
      if (newInstance.teacherId === inst.teacherId) {
        return { success: false, error: formatConflictMsg("Trùng lịch giảng viên") };
      }
      // C. Same class
      if (newInstance.classId === inst.classId) {
        return { success: false, error: formatConflictMsg("Trùng lịch lớp") };
      }
      // D. Shared students (warning only) — so học sinh của class MỚI với học sinh class trùng giờ
      if (!ignoreWarning) {
        const existingClassStudents = (loaded.series.class as any)?.students ?? [];
        const shared = candidateStudents.filter((s1: any) =>
          existingClassStudents.some((s2: any) => s2.userId === s1.userId)
        );
        if (shared.length > 0) {
          const dateLabel = ` ngày ${dateToUtcStr(inst.instanceDate)}`;
          if (isTeacher && inst.teacherId !== currentTeacherProfileId) {
            return {
              success: false,
              isWarning: true,
              error: `CẢNH BÁO TRÙNG LỊCH HỌC SINH: Lớp học có học viên bận trong khoảng thời gian (${inst.startTime} - ${inst.endTime})${dateLabel} học lớp khác. Bạn có muốn tiếp tục ${label}?`,
            };
          } else {
            const studentNames = shared.map((s: any) => s.user.name).slice(0, 3).join(", ") +
              (shared.length > 3 ? ` và ${shared.length - 3} học viên khác` : "");
            return {
              success: false,
              isWarning: true,
              error: `CẢNH BÁO TRÙNG LỊCH HỌC SINH: Trùng giờ với lớp ${loaded.series.class.name} (${inst.startTime} - ${inst.endTime}${dateLabel}, môn ${loaded.series.subject.name}). Học viên trùng: ${studentNames}. Bạn có muốn tiếp tục ${label}?`,
            };
          }
        }
      }
    }
  }
  return null;
}

/** Kiểm tra có bài nộp cho 1 instance hoặc 1 dải instance. */
async function hasSubmissions(seriesId: string, instanceDate?: Date, gteDate?: Date): Promise<boolean> {
  const where: any = { seriesId };
  if (instanceDate) where.instanceDate = instanceDate;
  else if (gteDate) where.instanceDate = { gte: gteDate };
  const count = await db.homeworkSubmission.count({ where });
  return count > 0;
}

/** Build các key advisory lock (room/teacher/class × ngày) cho 1 dải ngày. */
/**
 * Build advisory-lock keys. Chỉ 3 keys (room/teacher/class), KHÔNG theo từng ngày:
 * mỗi `$queryRaw` trong Prisma interactive transaction tốn ~50ms round-trip,
 * lock theo từng ngày trong window 6 tháng (~78 keys) sẽ chậm >4s. Mục đích lock
 * chỉ là "xếp hàng" các thao tác cùng room/teacher/class để check-conflict + insert
 * atomic — 3 keys cố định là đủ.
 */
function buildLockKeys(opts: {
  room: string; teacherId: string; classId: string;
  fromDate: Date; toDate: Date;
}): { kind: string; label: string; date: Date }[] {
  const anchorDate = toUtc(opts.fromDate);
  return [
    { kind: "room", label: (opts.room || "").toLowerCase(), date: anchorDate },
    { kind: "teacher", label: opts.teacherId, date: anchorDate },
    { kind: "class", label: opts.classId, date: anchorDate },
  ];
}

// ─── createSchedule ──────────────────────────────────────────────────

export async function createSchedule(input: CreateScheduleInput) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Bạn không có quyền thực hiện thao tác này." };
    }

    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, ignoreWarning, startDate, endDate } = input;

    if (!classId || !subjectId || !teacherId || isNaN(dayOfWeek) || !startTime || !endTime || !room || !startDate) {
      return { success: false, error: "Vui lòng nhập đầy đủ thông tin lịch học, bao gồm cả phòng học và ngày bắt đầu." };
    }

    const actualDow = toUtc(startDate).getUTCDay();
    const normalizedActual = actualDow === 0 ? 7 : actualDow;
    if (normalizedActual !== dayOfWeek) {
      return { success: false, error: "Ngày bắt đầu không khớp với thứ đã chọn" };
    }

    // Giáo viên chỉ được đăng ký lịch cho lớp mình phụ trách và cho chính mình
    const isTeacher = session.role === "TEACHER";
    let currentTeacherProfileId = "";
    if (isTeacher) {
      const teacherProfile = await db.teacherProfile.findUnique({ where: { userId: session.userId } });
      currentTeacherProfileId = teacherProfile?.id || "";
      if (!currentTeacherProfileId) return { success: false, error: "Không tìm thấy hồ sơ giảng viên." };
      if (!(await teacherOwnsClass(session.userId, classId)))
        return { success: false, error: "Bạn không được phép đăng ký lịch cho lớp này." };
      if (teacherId !== currentTeacherProfileId)
        return { success: false, error: "Bạn không thể đăng ký lịch cho giảng viên khác." };
    }

    // 1. Auto-create room if it doesn't exist in the Room table
    const targetRoom = await db.room.findFirst({
      where: { name: { equals: room.trim(), mode: "insensitive" } }
    });
    if (!targetRoom) {
      await db.room.create({ data: { name: room.trim() } });
    }

    // 2. Validate start and end times chronologically
    const startMin = parseTimeToMinutes(startTime);
    const endMin = parseTimeToMinutes(endTime);
    if (startMin === -1 || endMin === -1) {
      return { success: false, error: "Thời gian không hợp lệ. Vui lòng nhập đúng định dạng HH:MM (ví dụ: 08:30)." };
    }
    if (startMin >= endMin) {
      return { success: false, error: "Lỗi giờ học: Giờ bắt đầu phải nhỏ hơn giờ kết thúc." };
    }

    const seriesStart = toUtc(startDate);
    const seriesEnd = endDate ? toUtc(endDate) : null;
    if (seriesEnd && seriesEnd < seriesStart) {
      return { success: false, error: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu." };
    }

    // 3. Window check conflict (giới hạn series vô hạn)
    const windowTo = seriesEnd ?? addDaysUtc(seriesStart, CONFLICT_CHECK_WINDOW_DAYS);

    // 4. Advisory lock + check conflict + create — trong cùng 1 transaction để atomic.
    //    pg_advisory_xact_lock qua tx.$executeRaw giữ tới khi tx commit.

    // Lock keys cho từng ngày (cách 7 ngày) trong window
    const lockKeys = buildLockKeys({ room: room.trim(), teacherId, classId, fromDate: seriesStart, toDate: windowTo });

    const series = await db.$transaction(async (tx) => {
      // Acquire advisory locks trước (giữ tới cuối transaction này)
      await acquireAdvisoryLocks(tx, lockKeys);

      // Check conflict trên toàn bộ instance hiện có trong window
      const existing = await loadInstancesForConflictCheck(tx, { dayOfWeek, fromDate: seriesStart, toDate: windowTo });

      const candidate = {
        seriesId: "__new__",
        instanceDate: seriesStart,
        classId, subjectId, teacherId, dayOfWeek, startTime, endTime,
        room: room.trim(),
      };
      const candidateClass = await tx.class.findUnique({
        where: { id: classId },
        include: { students: { include: { user: true } } },
      });
      const candidateStudents = (candidateClass?.students as any[]) ?? [];
      const conflict = findConflicts(candidate, existing, isTeacher, currentTeacherProfileId, ignoreWarning ?? false, "tạo", candidateStudents);
      if (conflict) throw conflict;

      // Create the series
      return tx.scheduleSeries.create({
        data: {
          classId, subjectId, teacherId, dayOfWeek, startTime, endTime,
          room: room.trim(),
          startDate: seriesStart,
          endDate: seriesEnd,
        },
      });
    });

    revalidatePath("/admin/calendar");
    revalidatePath("/teacher/calendar");
    return { success: true, message: "Đăng ký lịch học thành công.", data: { seriesId: series.id } };
  } catch (error: any) {
    if (error?.error || error?.isWarning) {
      return { success: false, ...error }; // conflict / warning result (luôn có success: false)
    }
    console.error("Error creating schedule:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi xếp lịch." };
  }
}

// ─── updateSchedule ──────────────────────────────────────────────────

export async function updateSchedule(input: UpdateScheduleInput) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Bạn không có quyền thực hiện thao tác này." };
    }

    const { seriesId, instanceDate, classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, endDate, updateMode, ignoreWarning } = input;

    if (!seriesId || !classId || !subjectId || !teacherId || isNaN(dayOfWeek) || !startTime || !endTime || !room || !instanceDate) {
      return { success: false, error: "Vui lòng nhập đầy đủ thông tin lịch học." };
    }

    const targetRoom = await db.room.findFirst({
      where: { name: { equals: room.trim(), mode: "insensitive" } }
    });
    if (!targetRoom) {
      return { success: false, error: `Phòng học "${room}" không tồn tại. Vui lòng chọn một phòng học hợp lệ do Admin quản lý.` };
    }

    const startMin = parseTimeToMinutes(startTime);
    const endMin = parseTimeToMinutes(endTime);
    if (startMin === -1 || endMin === -1) {
      return { success: false, error: "Thời gian không hợp lệ. Vui lòng nhập đúng định dạng HH:MM (ví dụ: 08:30)." };
    }
    if (startMin >= endMin) {
      return { success: false, error: "Lỗi giờ học: Giờ bắt đầu phải nhỏ hơn giờ kết thúc." };
    }

    const targetSeries = await db.scheduleSeries.findUnique({
      where: { id: seriesId },
      include: {
        class: { include: { students: { include: { user: true } } } },
        subject: true,
        teacher: { include: { user: true } },
        exceptions: true,
      },
    });
    if (!targetSeries) {
      return { success: false, error: "Không tìm thấy chuỗi lịch học cần cập nhật." };
    }

    const isTeacher = session.role === "TEACHER";
    let currentTeacherProfileId = "";
    if (isTeacher) {
      const teacherProfile = await db.teacherProfile.findUnique({ where: { userId: session.userId } });
      currentTeacherProfileId = teacherProfile?.id || "";
      if (!currentTeacherProfileId) return { success: false, error: "Không tìm thấy hồ sơ giảng viên." };
      if (targetSeries.teacherId !== currentTeacherProfileId)
        return { success: false, error: "Bạn không được phép chỉnh sửa lịch của giảng viên khác." };
      if (!(await teacherOwnsClass(session.userId, classId)))
        return { success: false, error: "Bạn không được phép đăng ký lịch cho lớp này." };
      if (teacherId !== currentTeacherProfileId)
        return { success: false, error: "Bạn không thể gán lịch cho giảng viên khác." };
    }

    const targetDate = toUtc(instanceDate);
    // endDate: undefined = KHÔNG đổi endDate series (giữ nguyên); null = vô hạn; string = set ngày mới.
    const endDateChanged = "endDate" in input;
    const newEndDate = endDateChanged ? (endDate ? toUtc(endDate) : null) : undefined;

    // ─── Mode ONLY_THIS: tạo/update exception MODIFIED ───
    if (updateMode === "ONLY_THIS") {
      // ONLY_THIS chỉ tạo 1 exception (không cắt/ghi series). Conflict check chạy trên db trực tiếp.
      const existing = await loadInstancesForConflictCheck(db, {
        dayOfWeek,
        fromDate: targetDate,
        toDate: targetDate,
        excludeSeriesIds: [seriesId],
      });

      const candidate = {
        seriesId,
        instanceDate: targetDate,
        classId, subjectId, teacherId, dayOfWeek, startTime, endTime,
        room: room.trim(),
      };
      const candidateClass = await db.class.findUnique({
        where: { id: classId },
        include: { students: { include: { user: true } } },
      });
      const candidateStudents = (candidateClass?.students as any[]) ?? [];
      const conflict = findConflicts(candidate, existing, isTeacher, currentTeacherProfileId, ignoreWarning ?? false, "cập nhật", candidateStudents);
      if (conflict) return conflict;

      await db.scheduleException.upsert({
        where: { seriesId_originalDate: { seriesId, originalDate: targetDate } },
        create: {
          seriesId, originalDate: targetDate, status: "MODIFIED",
          classId, subjectId, teacherId, room: room.trim(), startTime, endTime,
        },
        update: {
          status: "MODIFIED",
          classId, subjectId, teacherId, room: room.trim(), startTime, endTime,
        },
      });

      revalidatePath("/admin/calendar");
      revalidatePath("/teacher/calendar");
      return { success: true, message: "Cập nhật buổi học thành công." };
    }

    // ─── Mode ALL_FUTURE: cắt series cũ + tạo series mới ───
    if (updateMode === "ALL_FUTURE") {
      const cutoverDate = targetDate;

      // Guard: check bài nộp cho các instance >= cutover
      if (await hasSubmissions(seriesId, undefined, cutoverDate)) {
        return {
          success: false,
          error: "Không thể sửa: Học viên đã nộp bài tập về nhà trong các buổi sắp tới. Vui lòng chấm điểm hoặc hoàn thành các bài tập trước.",
        };
      }

      const windowTo = newEndDate ?? addDaysUtc(cutoverDate, CONFLICT_CHECK_WINDOW_DAYS);

      // Advisory lock: union khóa cũ (series hiện tại) + khóa mới
      const oldLockKeys = buildLockKeys({
        room: targetSeries.room || "", teacherId: targetSeries.teacherId, classId: targetSeries.classId,
        fromDate: cutoverDate, toDate: windowTo,
      });
      const newLockKeys = buildLockKeys({
        room: room.trim(), teacherId, classId,
        fromDate: cutoverDate, toDate: windowTo,
      });

      const result = await db.$transaction(async (tx) => {
        await acquireAdvisoryLocks(tx, [...oldLockKeys, ...newLockKeys]);

        // Check conflict cho series mới (loại trừ seriesId nguồn)
        const existing = await loadInstancesForConflictCheck(tx, {
          dayOfWeek,
          fromDate: cutoverDate,
          toDate: windowTo,
          excludeSeriesIds: [seriesId],
        });
        const candClass = await tx.class.findUnique({
          where: { id: classId },
          include: { students: { include: { user: true } } },
        });
        const conflict = await checkConflictsForNewSeries({
          seriesId, classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room: room.trim(),
          fromDate: cutoverDate, toDate: windowTo,
          existing, isTeacher, currentTeacherProfileId, ignoreWarning: ignoreWarning ?? false, label: "cập nhật",
          candidateStudents: (candClass?.students as any[]) ?? [],
        });
        if (conflict) throw conflict;

        // 1. Cắt series cũ: endDate = ngày trước cutover
        await tx.scheduleSeries.update({
          where: { id: seriesId },
          data: { endDate: addDaysUtc(cutoverDate, -1) },
        });

        // 2. Tạo series mới từ cutover. endDate: nếu user không đổi → kế thừa endDate series cũ.
        const newSeriesEndDate = endDateChanged ? newEndDate : targetSeries.endDate;
        const newSeries = await tx.scheduleSeries.create({
          data: {
            classId, subjectId, teacherId, dayOfWeek, startTime, endTime,
            room: room.trim(),
            startDate: cutoverDate,
            endDate: newSeriesEndDate,
          },
        });

        // 3. Di dời exception + homework >= cutover sang series mới
        await tx.scheduleException.updateMany({
          where: { seriesId, originalDate: { gte: cutoverDate } },
          data: { seriesId: newSeries.id },
        });
        await tx.homeworkSubmission.updateMany({
          where: { seriesId, instanceDate: { gte: cutoverDate } },
          data: { seriesId: newSeries.id },
        });

        return newSeries;
      });

      revalidatePath("/admin/calendar");
      revalidatePath("/teacher/calendar");
      return { success: true, message: "Cập nhật buổi này và các buổi sau thành công." };
    }

    // ─── Mode ALL: update trực tiếp series gốc ───
    const windowTo = newEndDate ?? addDaysUtc(targetSeries.startDate, CONFLICT_CHECK_WINDOW_DAYS);

    const result = await db.$transaction(async (tx) => {
      // Advisory lock: union khóa cũ + khóa mới
      const oldLockKeys = buildLockKeys({
        room: targetSeries.room || "", teacherId: targetSeries.teacherId, classId: targetSeries.classId,
        fromDate: targetSeries.startDate, toDate: windowTo,
      });
      const newLockKeys = buildLockKeys({
        room: room.trim(), teacherId, classId,
        fromDate: targetSeries.startDate, toDate: windowTo,
      });
      await acquireAdvisoryLocks(tx, [...oldLockKeys, ...newLockKeys]);

      // Check conflict cho toàn bộ instance của series với field mới
      const existing = await loadInstancesForConflictCheck(tx, {
        dayOfWeek,
        fromDate: targetSeries.startDate,
        toDate: windowTo,
        excludeSeriesIds: [seriesId],
      });
      const candClass = await tx.class.findUnique({
        where: { id: classId },
        include: { students: { include: { user: true } } },
      });
      const conflict = await checkConflictsForNewSeries({
        seriesId, classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room: room.trim(),
        fromDate: targetSeries.startDate, toDate: windowTo,
        existing, isTeacher, currentTeacherProfileId, ignoreWarning: ignoreWarning ?? false, label: "cập nhật",
        candidateStudents: (candClass?.students as any[]) ?? [],
      });
      if (conflict) throw conflict;

      // Rút ngắn endDate → guard bài nộp + xóa exception sau endDate mới
      if (newEndDate && targetSeries.endDate && newEndDate < targetSeries.endDate) {
        const cutoff = addDaysUtc(newEndDate, 1);
        if (await hasSubmissions(seriesId, undefined, cutoff)) {
          throw {
            error: "Không thể rút ngắn lịch: Học viên đã nộp bài tập trong các buổi sau ngày kết thúc mới. Vui lòng chấm điểm trước.",
          };
        }
        await tx.scheduleException.deleteMany({
          where: { seriesId, originalDate: { gt: newEndDate } },
        });
      }

      const updateData: any = {
        classId, subjectId, teacherId, dayOfWeek, startTime, endTime,
        room: room.trim(),
      };
      // Chỉ set endDate khi user đổi (undefined = giữ nguyên, tránh biến chuỗi hữu hạn thành vô hạn)
      if (endDateChanged) updateData.endDate = newEndDate;
      await tx.scheduleSeries.update({
        where: { id: seriesId },
        data: updateData,
      });
      return true;
    });

    revalidatePath("/admin/calendar");
    revalidatePath("/teacher/calendar");
    return { success: true, message: "Cập nhật toàn bộ buổi học thành công." };
  } catch (error: any) {
    if (error?.error || error?.isWarning) {
      return { success: false, ...error };
    }
    console.error("Error updating schedule:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi cập nhật lịch." };
  }
}

/** Check conflict cho toàn bộ instance của series mới (ALL_FUTURE / ALL). */
async function checkConflictsForNewSeries(opts: {
  seriesId: string; classId: string; subjectId: string; teacherId: string;
  dayOfWeek: number; startTime: string; endTime: string; room: string;
  fromDate: Date; toDate: Date;
  existing: LoadedSeries[];
  isTeacher: boolean; currentTeacherProfileId: string; ignoreWarning: boolean; label: string;
  candidateStudents?: any[];
}) {
  const { seriesId, classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, fromDate, toDate, existing, isTeacher, currentTeacherProfileId, ignoreWarning, label, candidateStudents = [] } = opts;

  const newSeriesLike: SeriesLike = {
    id: seriesId, classId, subjectId, teacherId, dayOfWeek, startTime, endTime,
    room, startDate: fromDate, endDate: toDate,
    materials: null, homework: null, homeworkDueDate: null, homeworkQuizId: null,
  };
  const newInstances = expandSeriesToInstances(newSeriesLike, [], fromDate, toDate);

  for (const inst of newInstances) {
    const conflict = findConflicts(inst, existing, isTeacher, currentTeacherProfileId, ignoreWarning, label, candidateStudents);
    if (conflict) return conflict;
  }
  return null;
}

// ─── deleteSchedule ──────────────────────────────────────────────────

export async function deleteSchedule(input: DeleteScheduleInput) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Bạn không có quyền thực hiện thao tác này." };
    }

    const { seriesId, instanceDate, deleteMode } = input;

    const targetSeries = await db.scheduleSeries.findUnique({
      where: { id: seriesId },
    });
    if (!targetSeries) {
      return { success: false, error: "Không tìm thấy chuỗi lịch học." };
    }

    // Giáo viên chỉ xóa lịch của chính mình
    if (session.role === "TEACHER") {
      const teacherProfile = await db.teacherProfile.findUnique({ where: { userId: session.userId } });
      const currentTeacherProfileId = teacherProfile?.id || "";
      if (!currentTeacherProfileId || targetSeries.teacherId !== currentTeacherProfileId)
        return { success: false, error: "Bạn không được phép xóa lịch của giảng viên khác." };
    }

    const targetDate = toUtc(instanceDate);

    if (deleteMode === "ALL_FUTURE") {
      if (await hasSubmissions(seriesId, undefined, targetDate)) {
        return {
          success: false,
          error: "Không thể xóa: Học viên đã nộp bài tập về nhà trong các buổi sắp tới. Vui lòng chấm điểm hoặc hoàn thành các bài tập trước.",
        };
      }

      // Cắt endDate = ngày trước targetDate; xóa exception >= targetDate
      await db.$transaction([
        db.scheduleSeries.update({
          where: { id: seriesId },
          data: { endDate: addDaysUtc(targetDate, -1) },
        }),
        db.scheduleException.deleteMany({
          where: { seriesId, originalDate: { gte: targetDate } },
        }),
      ]);
    } else {
      // ONLY_THIS: tạo exception CANCELLED cho đúng ngày đó
      if (await hasSubmissions(seriesId, targetDate)) {
        return {
          success: false,
          error: "Không thể xóa: Học viên đã nộp bài tập cho buổi học này. Vui lòng chấm điểm bài nộp trước.",
        };
      }
      await db.scheduleException.upsert({
        where: { seriesId_originalDate: { seriesId, originalDate: targetDate } },
        create: { seriesId, originalDate: targetDate, status: "CANCELLED" },
        update: {
          status: "CANCELLED",
          classId: null, subjectId: null, teacherId: null, room: null, startTime: null, endTime: null,
        },
      });
    }

    revalidatePath("/admin/calendar");
    revalidatePath("/teacher/calendar");
    return { success: true, message: "Xoá buổi lịch học thành công." };
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi xoá buổi học." };
  }
}
