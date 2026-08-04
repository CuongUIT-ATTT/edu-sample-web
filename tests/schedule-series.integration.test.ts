import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from "vitest";

// Chỉ tắt mock @/lib/db để action dùng DB thật; giữ mock @/lib/auth để set session ADMIN.
vi.unmock("@/lib/db");

import { db } from "./helpers";
import { getSession } from "@/lib/auth";
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "@/actions/schedules";
import {
  expandSeriesToInstances,
  normalizeDateUtc,
  dateToUtcStr,
} from "@/lib/schedule-expand";

const adminSession = { userId: "test-admin", email: "admin@test.local", role: "ADMIN" as const, name: "Test Admin" };
vi.mocked(getSession).mockResolvedValue(adminSession);

let classId1 = "";
let classId2 = "";
let subjectId = "";
let teacherId1 = "";
let teacherId2 = "";
let studentA = "";

async function clearAll() {
  const series = await db.scheduleSeries.findMany({
    where: { classId: { in: [classId1, classId2] } },
  });
  for (const s of series) {
    await db.homeworkSubmission.deleteMany({ where: { seriesId: s.id } });
    await db.scheduleException.deleteMany({ where: { seriesId: s.id } });
    await db.scheduleSeries.delete({ where: { id: s.id } });
  }
  for (const cid of [classId1, classId2]) {
    if (!cid) continue;
    const cls = await db.class.findUnique({ where: { id: cid }, include: { students: true } });
    if (cls) {
      for (const st of cls.students) {
        await db.user.deleteMany({ where: { id: st.userId } }).catch(() => {});
        await db.studentProfile.deleteMany({ where: { id: st.id } }).catch(() => {});
      }
    }
    await db.class.deleteMany({ where: { id: cid } }).catch(() => {});
  }
}

const unique = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

describe("ScheduleSeries CRUD integration", () => {
  // Mỗi test độc lập: xóa mọi series/exception/homework của 2 class trước mỗi test
  // (class + students giữ nguyên). Tránh conflict chéo giữa các test.
  beforeEach(async () => {
    const series = await db.scheduleSeries.findMany({
      where: { classId: { in: [classId1, classId2] } },
    });
    for (const s of series) {
      await db.homeworkSubmission.deleteMany({ where: { seriesId: s.id } });
      await db.scheduleException.deleteMany({ where: { seriesId: s.id } });
      await db.scheduleSeries.delete({ where: { id: s.id } });
    }
  });

  beforeAll(async () => {
    teacherId1 = (await db.teacherProfile.findFirstOrThrow()).id;
    const allTeachers = await db.teacherProfile.findMany();
    teacherId2 = allTeachers.length > 1 ? allTeachers[1].id : teacherId1;
    subjectId = (await db.subject.findFirstOrThrow()).id;

    const c1 = await db.class.create({ data: { name: unique("SR-C1"), gradeLevel: 10 } });
    classId1 = c1.id;
    const c2 = await db.class.create({ data: { name: unique("SR-C2"), gradeLevel: 10 } });
    classId2 = c2.id;

    // 1 học sinh thuộc cả 2 lớp (test trùng học sinh)
    const uA = await db.user.create({ data: { email: unique("srA") + "@t.local", name: "Sr A", passwordHash: "x", role: "STUDENT" } });
    const sA = await db.studentProfile.create({ data: { userId: uA.id, classes: { connect: [{ id: classId1 }, { id: classId2 }] } } });
    studentA = sA.id;
  });

  afterAll(async () => {
    await clearAll();
  });

  it("1. createSchedule tạo 1 ScheduleSeries + expand ra đúng số buổi", async () => {
    // Thứ 3 (dayOfWeek 2) từ 2026-08-04 tới 2026-08-18 → 3 buổi (04, 11, 18)
    const res = await createSchedule({
      classId: classId1,
      subjectId,
      teacherId: teacherId1,
      dayOfWeek: 2,
      startTime: "08:00",
      endTime: "09:30",
      room: "SERIES-A",
      startDate: "2026-08-04",
      endDate: "2026-08-18",
    });
    expect(res.success).toBe(true);

    const series = await db.scheduleSeries.findUnique({ where: { id: (res as any).data.seriesId }, include: { exceptions: true } });
    expect(series).not.toBeNull();
    const instances = expandSeriesToInstances(series!, series!.exceptions, normalizeDateUtc("2026-08-01"), normalizeDateUtc("2026-08-31"));
    expect(instances.map((i) => dateToUtcStr(i.instanceDate))).toEqual(["2026-08-04", "2026-08-11", "2026-08-18"]);
  });

  it("2. trùng phòng → block (không tạo)", async () => {
    // Tạo series ở SERIES-B trước
    const first = await createSchedule({
      classId: classId1, subjectId, teacherId: teacherId1,
      dayOfWeek: 3, startTime: "08:00", endTime: "09:30", room: "SERIES-B",
      startDate: "2026-08-05",
    });
    expect(first.success).toBe(true);

    // Tạo series khác cùng phòng SERIES-B, cùng thứ, trùng giờ
    const clash = await createSchedule({
      classId: classId2, subjectId, teacherId: teacherId2,
      dayOfWeek: 3, startTime: "08:30", endTime: "10:00", room: "SERIES-B",
      startDate: "2026-08-05",
    });
    expect(clash.success).toBe(false);
    expect(clash.error).toContain("Trùng phòng học");
  });

  it("3. trùng học sinh → warning (không block) khi 2 lớp cùng giờ, học sinh chung", async () => {
    // Học sinh A thuộc cả 2 lớp. Tạo series class1
    const first = await createSchedule({
      classId: classId1, subjectId, teacherId: teacherId1,
      dayOfWeek: 4, startTime: "14:00", endTime: "15:30", room: "SERIES-C",
      startDate: "2026-08-06",
    });
    expect(first.success).toBe(true);

    // Cùng giờ, khác phòng, lớp 2 (có chung học sinh A) → warning
    const warning = await createSchedule({
      classId: classId2, subjectId, teacherId: teacherId2,
      dayOfWeek: 4, startTime: "14:00", endTime: "15:30", room: "SERIES-D",
      startDate: "2026-08-06",
    });
    expect((warning as any).isWarning).toBe(true);
    expect(warning.success).toBe(false);
    expect(warning.error).toContain("TRÙNG LỊCH HỌC SINH");

    // Với ignoreWarning=true → tạo thành công
    const forced = await createSchedule({
      classId: classId2, subjectId, teacherId: teacherId2,
      dayOfWeek: 4, startTime: "14:00", endTime: "15:30", room: "SERIES-D",
      startDate: "2026-08-06",
      ignoreWarning: true,
    });
    expect(forced.success).toBe(true);
  });

  it("4. updateSchedule ONLY_THIS tạo exception MODIFIED, các buổi khác giữ nguyên", async () => {
    const res = await createSchedule({
      classId: classId1, subjectId, teacherId: teacherId1,
      dayOfWeek: 2, startTime: "09:00", endTime: "10:30", room: "SERIES-E",
      startDate: "2026-08-04",
    });
    expect(res.success).toBe(true);
    const seriesId = (res as any).data.seriesId;

    // Sửa buổi 2026-08-11 (chỉ buổi này) → exception MODIFIED
    const upd = await updateSchedule({
      seriesId,
      instanceDate: "2026-08-11",
      classId: classId1, subjectId, teacherId: teacherId1,
      dayOfWeek: 2, startTime: "11:00", endTime: "12:30", room: "SERIES-E",
      updateMode: "ONLY_THIS",
    });
    expect(upd.success).toBe(true);

    const exc = await db.scheduleException.findUnique({
      where: { seriesId_originalDate: { seriesId, originalDate: normalizeDateUtc("2026-08-11") } },
    });
    expect(exc).not.toBeNull();
    expect(exc!.status).toBe("MODIFIED");
    expect(exc!.startTime).toBe("11:00");

    // Expand → 11/08 đổi, 04/08 và 18/08 giữ nguyên 09:00
    const full = await db.scheduleSeries.findUnique({ where: { id: seriesId }, include: { exceptions: true } });
    const instances = expandSeriesToInstances(full!, full!.exceptions, normalizeDateUtc("2026-08-01"), normalizeDateUtc("2026-08-31"));
    const byDate = Object.fromEntries(instances.map((i) => [dateToUtcStr(i.instanceDate), i.startTime]));
    expect(byDate["2026-08-04"]).toBe("09:00");
    expect(byDate["2026-08-11"]).toBe("11:00");
    expect(byDate["2026-08-18"]).toBe("09:00");
  });

  it("5. updateSchedule ALL_FUTURE cắt series + tạo series mới + di dời + guard bài nộp", async () => {
    const res = await createSchedule({
      classId: classId1, subjectId, teacherId: teacherId1,
      dayOfWeek: 2, startTime: "07:00", endTime: "08:30", room: "SERIES-F",
      startDate: "2026-08-04",
    });
    expect(res.success).toBe(true);
    const oldSeriesId = (res as any).data.seriesId;

    // Nộp 1 bài cho buổi 2026-08-11 (thuộc phần sắp bị cắt) → phải bị chặn
    await db.homeworkSubmission.create({
      data: { seriesId: oldSeriesId, instanceDate: normalizeDateUtc("2026-08-11"), studentId: studentA, fileUrl: "x", fileName: "x" },
    });

    const blocked = await updateSchedule({
      seriesId: oldSeriesId, instanceDate: "2026-08-11",
      classId: classId1, subjectId, teacherId: teacherId1,
      dayOfWeek: 2, startTime: "07:00", endTime: "08:30", room: "SERIES-F",
      updateMode: "ALL_FUTURE",
    });
    expect(blocked.success).toBe(false);
    expect(blocked.error).toContain("đã nộp bài tập");

    // Xóa bài nộp để cho phép cắt
    await db.homeworkSubmission.deleteMany({ where: { seriesId: oldSeriesId } });

    const ok = await updateSchedule({
      seriesId: oldSeriesId, instanceDate: "2026-08-11",
      classId: classId1, subjectId, teacherId: teacherId1,
      dayOfWeek: 2, startTime: "16:00", endTime: "17:30", room: "SERIES-F",
      updateMode: "ALL_FUTURE",
    });
    expect(ok.success).toBe(true);

    // Series cũ endDate = 10/08; series mới bắt đầu từ 11/08 giờ 16:00
    const oldSeries = await db.scheduleSeries.findUnique({ where: { id: oldSeriesId } });
    expect(oldSeries!.endDate).not.toBeNull();
    expect(dateToUtcStr(oldSeries!.endDate!)).toBe("2026-08-10");

    const newSeries = await db.scheduleSeries.findFirst({
      where: { classId: classId1, startTime: "16:00", dayOfWeek: 2 },
    });
    expect(newSeries).not.toBeNull();
    expect(dateToUtcStr(newSeries!.startDate)).toBe("2026-08-11");
  });

  it("6. deleteSchedule ONLY_THIS tạo exception CANCELLED", async () => {
    const res = await createSchedule({
      classId: classId1, subjectId, teacherId: teacherId1,
      dayOfWeek: 5, startTime: "10:00", endTime: "11:30", room: "SERIES-G",
      startDate: "2026-08-07",
    });
    expect(res.success).toBe(true);
    const seriesId = (res as any).data.seriesId;

    const del = await deleteSchedule({ seriesId, instanceDate: "2026-08-07", deleteMode: "ONLY_THIS" });
    expect(del.success).toBe(true);

    const exc = await db.scheduleException.findUnique({
      where: { seriesId_originalDate: { seriesId, originalDate: normalizeDateUtc("2026-08-07") } },
    });
    expect(exc).not.toBeNull();
    expect(exc!.status).toBe("CANCELLED");

    // Expand → buổi 07/08 bị skip (CANCELLED), các buổi Thứ 6 sau vẫn còn (14, 21, 28)
    const full = await db.scheduleSeries.findUnique({ where: { id: seriesId }, include: { exceptions: true } });
    const instances = expandSeriesToInstances(full!, full!.exceptions, normalizeDateUtc("2026-08-01"), normalizeDateUtc("2026-08-31"));
    const dates = instances.map((i) => dateToUtcStr(i.instanceDate));
    expect(dates).not.toContain("2026-08-07");
    expect(dates).toContain("2026-08-14");
    expect(dates).toContain("2026-08-21");
    expect(dates).toContain("2026-08-28");
    expect(instances).toHaveLength(3);
  });

  it("7. deleteSchedule ALL_FUTURE cắt endDate", async () => {
    const res = await createSchedule({
      classId: classId1, subjectId, teacherId: teacherId1,
      dayOfWeek: 2, startTime: "15:00", endTime: "16:30", room: "SERIES-H",
      startDate: "2026-08-04", endDate: "2026-08-25",
    });
    expect(res.success).toBe(true);
    const seriesId = (res as any).data.seriesId;

    const del = await deleteSchedule({ seriesId, instanceDate: "2026-08-18", deleteMode: "ALL_FUTURE" });
    expect(del.success).toBe(true);

    const series = await db.scheduleSeries.findUnique({ where: { id: seriesId } });
    expect(dateToUtcStr(series!.endDate!)).toBe("2026-08-17");

    const instances = expandSeriesToInstances(series!, [], normalizeDateUtc("2026-08-01"), normalizeDateUtc("2026-08-31"));
    expect(instances.map((i) => dateToUtcStr(i.instanceDate))).toEqual(["2026-08-04", "2026-08-11"]);
  });

  it("8. guard: deleteSchedule ONLY_THIS bị chặn khi có bài nộp cho buổi đó", async () => {
    const res = await createSchedule({
      classId: classId1, subjectId, teacherId: teacherId1,
      dayOfWeek: 6, startTime: "10:00", endTime: "11:30", room: "SERIES-I",
      startDate: "2026-08-08",
    });
    expect(res.success).toBe(true);
    const seriesId = (res as any).data.seriesId;

    await db.homeworkSubmission.create({
      data: { seriesId, instanceDate: normalizeDateUtc("2026-08-08"), studentId: studentA, fileUrl: "x", fileName: "x" },
    });

    const del = await deleteSchedule({ seriesId, instanceDate: "2026-08-08", deleteMode: "ONLY_THIS" });
    expect(del.success).toBe(false);
    expect(del.error).toContain("đã nộp bài tập");

    await db.homeworkSubmission.deleteMany({ where: { seriesId } });
  });

  it("9. updateSchedule ALL đổi endDate rút ngắn có bài nộp → bị chặn", async () => {
    const res = await createSchedule({
      classId: classId1, subjectId, teacherId: teacherId1,
      dayOfWeek: 2, startTime: "14:00", endTime: "15:30", room: "SERIES-J",
      startDate: "2026-08-04", endDate: "2026-09-01",
    });
    expect(res.success).toBe(true);
    const seriesId = (res as any).data.seriesId;

    await db.homeworkSubmission.create({
      data: { seriesId, instanceDate: normalizeDateUtc("2026-08-25"), studentId: studentA, fileUrl: "x", fileName: "x" },
    });

    const upd = await updateSchedule({
      seriesId, instanceDate: "2026-08-04",
      classId: classId1, subjectId, teacherId: teacherId1,
      dayOfWeek: 2, startTime: "14:00", endTime: "15:30", room: "SERIES-J",
      endDate: "2026-08-18",
      updateMode: "ALL",
    });
    expect(upd.success).toBe(false);
    expect(upd.error).toContain("đã nộp bài tập");

    await db.homeworkSubmission.deleteMany({ where: { seriesId } });

    // Không có bài nộp → rút ngắn thành công
    const ok = await updateSchedule({
      seriesId, instanceDate: "2026-08-04",
      classId: classId1, subjectId, teacherId: teacherId1,
      dayOfWeek: 2, startTime: "14:00", endTime: "15:30", room: "SERIES-J",
      endDate: "2026-08-18",
      updateMode: "ALL",
    });
    expect(ok.success).toBe(true);
    const series = await db.scheduleSeries.findUnique({ where: { id: seriesId } });
    expect(dateToUtcStr(series!.endDate!)).toBe("2026-08-18");
  });
});
