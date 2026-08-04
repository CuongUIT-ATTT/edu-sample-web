import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";
import { expandSeriesToInstances, normalizeDateUtc, jsDayToDow } from "@/lib/schedule-expand";
dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");
  const pwHash = await bcryptjs.hash("hungcuong123", 10);
  const g = (offset: number) => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset);
  };
  const now = new Date();
  const yr = now.getFullYear();
  const mo = now.getMonth();

  // Reset
  await prisma.quizSubmission.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.homeworkSubmission.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.tuitionPayment.deleteMany();
  await prisma.tuition.deleteMany();
  await prisma.tuitionFeeSetting.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.eventException.deleteMany();
  await prisma.eventParticipant.deleteMany();
  await prisma.event.deleteMany();
  await prisma.calendar.deleteMany();
  await prisma.documentClassVisibility.deleteMany();
  await prisma.document.deleteMany();
  await prisma.room.deleteMany();
  await prisma.scheduleSeries.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.parentProfile.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Reset done.\n");

  // ── 1. USERS ────────────────────────────────────
  const [a1, a2, a3] = await Promise.all([
    prisma.user.create({ data: { email: "admin@eduweb.vn", name: "Nguyễn Văn An", passwordHash: pwHash, role: "ADMIN" } }),
    prisma.user.create({ data: { email: "truong@eduweb.vn", name: "Trần Thị Bình", passwordHash: pwHash, role: "ADMIN" } }),
    prisma.user.create({ data: { email: "ke-toan@eduweb.vn", name: "Lê Văn Cường", passwordHash: pwHash, role: "ADMIN" } }),
  ]);
  const [t1, t2, t3, t4, t5] = await Promise.all([
    prisma.user.create({ data: { email: "toan@eduweb.vn", name: "Phạm Thị Dung", passwordHash: pwHash, role: "TEACHER" } }),
    prisma.user.create({ data: { email: "ly@eduweb.vn", name: "Hoàng Văn Em", passwordHash: pwHash, role: "TEACHER" } }),
    prisma.user.create({ data: { email: "hoa@eduweb.vn", name: "Vũ Thị Phương", passwordHash: pwHash, role: "TEACHER" } }),
    prisma.user.create({ data: { email: "van@eduweb.vn", name: "Đặng Văn Giang", passwordHash: pwHash, role: "TEACHER" } }),
    prisma.user.create({ data: { email: "anh@eduweb.vn", name: "Bùi Thị Hạnh", passwordHash: pwHash, role: "TEACHER" } }),
  ]);
  const [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10] = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      prisma.user.create({ data: { email: `parent${i + 1}@email.com`, name: `Phụ huynh ${i + 1}`, passwordHash: pwHash, role: "PARENT" } })
    )
  );
  const sUsers: string[] = [];
  for (let i = 1; i <= 31; i++) {
    const u = await prisma.user.create({
      data: { email: `hs${String(i).padStart(3, "0")}@email.com`, name: `Học sinh ${String(i).padStart(3, "0")}`, passwordHash: pwHash, role: "STUDENT" },
    });
    sUsers.push(u.id);
  }
  const all = [a1, a2, a3, t1, t2, t3, t4, t5, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, ...sUsers];
  const aIds = [a1.id, a2.id, a3.id];
  const tIds = [t1.id, t2.id, t3.id, t4.id, t5.id];
  const pIds_ = [p1.id, p2.id, p3.id, p4.id, p5.id, p6.id, p7.id, p8.id, p9.id, p10.id];

  // Profiles
  const [ap1, ap2, ap3] = await Promise.all(aIds.map((uid) => prisma.adminProfile.create({ data: { userId: uid } })));
  const [tp1, tp2, tp3, tp4, tp5] = await Promise.all(tIds.map((uid) => prisma.teacherProfile.create({ data: { userId: uid } })));
  const pp = await Promise.all(pIds_.map((uid) => prisma.parentProfile.create({ data: { userId: uid } })));
  const sp: string[] = [];
  for (let i = 1; i <= 31; i++) {
    // sp[0..9] có parent, sp[10..29] không parent, sp[30] chưa xếp lớp
    const x = await prisma.studentProfile.create({ data: { userId: sUsers[i - 1], parentId: i <= 10 ? pp[i - 1].id : undefined } });
    sp.push(x.id);
  }

  // ── 2. SUBJECTS ─────────────────────────────
  const [s1, s2, s3, s4, s5_, s6, s7, s8] = await Promise.all([
    prisma.subject.create({ data: { name: "Toán học", code: "MATH" } }),
    prisma.subject.create({ data: { name: "Vật lý", code: "PHYS" } }),
    prisma.subject.create({ data: { name: "Hóa học", code: "CHEM" } }),
    prisma.subject.create({ data: { name: "Ngữ văn", code: "LIT" } }),
    prisma.subject.create({ data: { name: "Lịch sử", code: "HIST" } }),
    prisma.subject.create({ data: { name: "Tiếng Anh", code: "ENG" } }),
    prisma.subject.create({ data: { name: "Sinh học", code: "BIO" } }),
    prisma.subject.create({ data: { name: "Tin học", code: "IT" } }),
  ]);
  // Gán teacher dạy môn
  await prisma.teacherProfile.update({ where: { id: tp1.id }, data: { subjects: { connect: [{ id: s1.id }, { id: s2.id }] } } });
  await prisma.teacherProfile.update({ where: { id: tp2.id }, data: { subjects: { connect: [{ id: s2.id }, { id: s3.id }] } } });
  await prisma.teacherProfile.update({ where: { id: tp3.id }, data: { subjects: { connect: [{ id: s3.id }, { id: s7.id }] } } });
  await prisma.teacherProfile.update({ where: { id: tp4.id }, data: { subjects: { connect: [{ id: s4.id }, { id: s5_.id }] } } });
  await prisma.teacherProfile.update({ where: { id: tp5.id }, data: { subjects: { connect: [{ id: s6.id }, { id: s8.id }] } } });

  // ── 3. CLASSES ───────────────────────────────
  const [c1, c2, c3, c4] = await Promise.all([
    prisma.class.create({ data: { name: "10A1", gradeLevel: 10, formTeacherId: tp1.id } }), // CASE: thầy Dung chủ nhiệm
    prisma.class.create({ data: { name: "10A2", gradeLevel: 10 } }),
    prisma.class.create({ data: { name: "11B1", gradeLevel: 11 } }),
    prisma.class.create({ data: { name: "12C1", gradeLevel: 12 } }),
  ]);
  for (let i = 0; i < 10; i++) await prisma.studentProfile.update({ where: { id: sp[i] }, data: { classes: { connect: { id: c1.id } } } });
  for (let i = 10; i < 20; i++) await prisma.studentProfile.update({ where: { id: sp[i] }, data: { classes: { connect: { id: c2.id } } } });
  for (let i = 20; i < 25; i++) await prisma.studentProfile.update({ where: { id: sp[i] }, data: { classes: { connect: { id: c3.id } } } });
  for (let i = 25; i < 30; i++) await prisma.studentProfile.update({ where: { id: sp[i] }, data: { classes: { connect: { id: c4.id } } } });
  // sp[30] chưa xếp lớp — CASE biên

  // ── 4. SCHEDULES (Master + Exception — ScheduleSeries) ──
  // Helper: series 1 buổi (single occurrence) — dayOfWeek tự khớp với ngày để expansion ra đúng 1 instance.
  const oneOff = (
    data: { classId: string; subjectId: string; teacherId: string; startTime: string; endTime: string; room?: string },
    date: Date
  ) => ({
    ...data,
    dayOfWeek: jsDayToDow(normalizeDateUtc(date).getUTCDay()),
    startDate: normalizeDateUtc(date),
    endDate: normalizeDateUtc(date),
  });
  await Promise.all([
    prisma.scheduleSeries.create({ data: oneOff({ classId: c1.id, subjectId: s1.id, teacherId: tp1.id, startTime: "07:30", endTime: "09:00", room: "P101" }, g(1)) }),
    prisma.scheduleSeries.create({ data: oneOff({ classId: c1.id, subjectId: s3.id, teacherId: tp3.id, startTime: "09:00", endTime: "10:30", room: "P102" }, g(2)) }),
    // CASE: TRÙNG PHÒNG + GIỜ (P101, 10:30-12:00)
    prisma.scheduleSeries.create({ data: oneOff({ classId: c2.id, subjectId: s2.id, teacherId: tp2.id, startTime: "10:30", endTime: "12:00", room: "P101" }, g(2)) }),
    prisma.scheduleSeries.create({ data: oneOff({ classId: c3.id, subjectId: s4.id, teacherId: tp4.id, startTime: "10:30", endTime: "12:00", room: "P101" }, g(2)) }),
    // CASE: CÙNG TEACHER TRÙNG GIỜ (thầy Dung 07:30-09:00 ở 2 lớp)
    prisma.scheduleSeries.create({ data: oneOff({ classId: c2.id, subjectId: s1.id, teacherId: tp1.id, startTime: "07:30", endTime: "09:00", room: "P201" }, g(3)) }),
    prisma.scheduleSeries.create({ data: oneOff({ classId: c3.id, subjectId: s1.id, teacherId: tp1.id, startTime: "07:30", endTime: "09:00", room: "P202" }, g(3)) }),
    // CASE: SERIES LẶP HÀNG TUẦN (recurring — endDate null = vô hạn)
    prisma.scheduleSeries.create({
      data: {
        classId: c2.id, subjectId: s6.id, teacherId: tp5.id,
        dayOfWeek: jsDayToDow(normalizeDateUtc(g(-7)).getUTCDay()),
        startTime: "13:30", endTime: "15:00", room: "P301",
        startDate: normalizeDateUtc(g(-7)), endDate: null,
      },
    }),
    prisma.scheduleSeries.create({ data: oneOff({ classId: c4.id, subjectId: s5_.id, teacherId: tp4.id, startTime: "07:30", endTime: "09:00", room: "P401" }, g(4)) }),
  ]);

  // ── 5. ATTENDANCE ────────────────────────────
  // CASE: sp[0] đủ 4 trạng thái
  await prisma.attendance.create({ data: { studentId: sp[0], date: g(-10), status: "PRESENT" } });
  await prisma.attendance.create({ data: { studentId: sp[0], date: g(-9), status: "ABSENT" } });
  await prisma.attendance.create({ data: { studentId: sp[0], date: g(-8), status: "LATE" } });
  await prisma.attendance.create({ data: { studentId: sp[0], date: g(-7), status: "EXCUSED" } });
  // CASE: Chuỗi ABSENT >=3 — sp[1]
  await prisma.attendance.create({ data: { studentId: sp[1], date: g(-6), status: "ABSENT" } });
  await prisma.attendance.create({ data: { studentId: sp[1], date: g(-5), status: "ABSENT" } });
  await prisma.attendance.create({ data: { studentId: sp[1], date: g(-4), status: "ABSENT" } });
  // sp[2] hỗn hợp
  await prisma.attendance.create({ data: { studentId: sp[2], date: g(-3), status: "PRESENT" } });
  await prisma.attendance.create({ data: { studentId: sp[2], date: g(-2), status: "ABSENT" } });
  await prisma.attendance.create({ data: { studentId: sp[2], date: g(-1), status: "PRESENT" } });
  // g(0): buổi đã qua nhưng chưa điểm danh — implicit

  // ── 6. HOMEWORK ──────────────────────────────
  const hwSeries = await prisma.scheduleSeries.findFirst({ where: { classId: c1.id, subjectId: s1.id } });
  if (hwSeries) {
    // instanceDate phải khớp 1 occurrence thực của series (tính runtime qua expandSeriesToInstances).
    const hwInstance = expandSeriesToInstances(hwSeries, [], normalizeDateUtc(g(1)), normalizeDateUtc(g(1)))[0];
    if (hwInstance) {
      await prisma.scheduleSeries.update({ where: { id: hwSeries.id }, data: { homeworkDueDate: new Date(yr, mo, now.getDate() - 5) } });
      // CASE: nộp đúng hạn + đã chấm
      await prisma.homeworkSubmission.create({ data: { seriesId: hwSeries.id, instanceDate: hwInstance.instanceDate, studentId: sp[0], fileUrl: "https://drive.google.com/hw-1", fileName: "Bai_tap_Toan_sp001.pdf", submittedAt: new Date(yr, mo, now.getDate() - 2), grade: 8.5, feedback: "Bài tốt!" } });
      // CASE: nộp trễ hạn
      await prisma.homeworkSubmission.create({ data: { seriesId: hwSeries.id, instanceDate: hwInstance.instanceDate, studentId: sp[1], fileUrl: "https://drive.google.com/hw-2", fileName: "Bai_tap_Toan_sp002.pdf", submittedAt: new Date(yr, mo, now.getDate() - 3), grade: 5.0, feedback: "Nộp muộn!" } });
      // CASE: nộp nhưng chưa chấm
      await prisma.homeworkSubmission.create({ data: { seriesId: hwSeries.id, instanceDate: hwInstance.instanceDate, studentId: sp[2], fileUrl: "https://drive.google.com/hw-3", fileName: "Bai_tap_Toan_sp003.pdf", submittedAt: new Date(yr, mo, now.getDate() - 1), grade: null, feedback: null } });
      // sp[3] không nộp — implicit
    }
  }

  // ── 7. GRADES ────────────────────────────────
  // CASE: sp[0] có đủ QUIZ/MIDTERM/FINAL cho Toán
  await prisma.grade.create({ data: { studentId: sp[0], subjectId: s1.id, teacherId: tp1.id, type: "QUIZ", score: 7.5, weight: 0.1 } });
  await prisma.grade.create({ data: { studentId: sp[0], subjectId: s1.id, teacherId: tp1.id, type: "MIDTERM", score: 8.0, weight: 0.3 } });
  await prisma.grade.create({ data: { studentId: sp[0], subjectId: s1.id, teacherId: tp1.id, type: "FINAL", score: 9.0, weight: 0.6 } });
  await prisma.grade.create({ data: { studentId: sp[0], subjectId: s2.id, teacherId: tp1.id, type: "MIDTERM", score: 6.0, weight: 0.4 } });

  // ── 8. QUIZ & QUESTIONS & SUBMISSIONS ────────
  await prisma.quiz.create({
    data: {
      id: "qz-001", title: "Trắc nghiệm Toán 10 - Chương 1", duration: 45, passingScore: 5.0,
      isPublic: true, subjectId: s1.id,
      questions: {
        create: [
          { id: "qs-001", text: "Giá trị của $\\sin 90^\\circ$ là:", type: "MULTIPLE_CHOICE", options: JSON.stringify(["0", "1", "-1", "0.5"]), correctAnswer: "1", score: 1.0, imageUrl: null },
          { id: "qs-002", text: "Cho hàm số $y = \\sin x$:\n(a) Hàm số chẵn.\n(b) Chu kỳ $2\\pi$.\n(c) Tập giá trị $[-1,1]$.\n(d) Đồng biến trên $(0,\\pi)$.",
            type: "TRUE_FALSE", options: JSON.stringify(["(a) Hàm số chẵn.", "(b) Chu kỳ $2\\pi$.", "(c) Tập giá trị $[-1,1]$.", "(d) Đồng biến trên $(0,\\pi)$."]),
            correctAnswer: "F,T,T,F", score: 2.0, imageUrl: "" },
          { id: "qs-003", text: "Cho hình vẽ sau:", type: "MULTIPLE_CHOICE", options: JSON.stringify(["Tam giác", "Hình vuông", "Hình tròn", "Hình thang"]),
            correctAnswer: "2", score: 1.0, imageUrl: "https://i.ibb.co/example/hinh-hoc.png" },
          { id: "qs-004", text: "Tính $\\int_0^1 x^2 dx$ (kết quả thập phân).", type: "SHORT_ANSWER", options: JSON.stringify([]), correctAnswer: "0.333", score: 1.0, imageUrl: null },
        ],
      },
    },
  });
  await prisma.quiz.create({
    data: {
      id: "qz-002", title: "Ôn tập Vật lý 11 - Điện từ", duration: 60, passingScore: 4.0,
      isPublic: false, subjectId: s2.id,
      questions: { create: [{ id: "qs-005", text: "Đơn vị của cường độ dòng điện là:", type: "MULTIPLE_CHOICE", options: JSON.stringify(["Vôn", "Ampe", "Ôm", "Oát"]), correctAnswer: "1", score: 1.0, imageUrl: null }] },
    },
  });
  await prisma.quiz.create({
    data: {
      id: "qz-003", title: "Kiểm tra 15' Lịch sử 12", duration: 15, passingScore: 5.0,
      isPublic: true, subjectId: s5_.id,
      questions: { create: [{ id: "qs-006", text: "Việt Nam tuyên bố độc lập ngày nào?", type: "MULTIPLE_CHOICE", options: JSON.stringify(["2/9/1945", "19/8/1945", "30/4/1975", "1/5/1954"]), correctAnswer: "0", score: 1.0, imageUrl: "" }] },
    },
  });

  const qz1q = await prisma.question.findMany({ where: { quizId: "qz-001" }, select: { id: true } });
  const qz3q = await prisma.question.findMany({ where: { quizId: "qz-003" }, select: { id: true } });
  // Nộp đúng giờ
  await prisma.quizSubmission.create({ data: { quizId: "qz-001", studentId: sp[0], score: 8.0, answers: Object.fromEntries(qz1q.map((q) => [q.id, "1"])), submittedAt: new Date() } });
  // Nộp sát giờ chót
  await prisma.quizSubmission.create({ data: { quizId: "qz-001", studentId: sp[1], score: 5.5, answers: Object.fromEntries(qz1q.map((q) => [q.id, "0"])), submittedAt: new Date(yr, mo, now.getDate(), now.getHours(), now.getMinutes() - 1) } });
  // Cố nộp sau khi hết hạn
  await prisma.quizSubmission.create({ data: { quizId: "qz-003", studentId: sp[2], score: 3.0, answers: Object.fromEntries(qz3q.map((q) => [q.id, "0"])), submittedAt: new Date() } });
  // Khách vãng lai
  await prisma.quizSubmission.create({ data: { quizId: "qz-001", studentId: null, guestName: "Nguyễn Văn Khách", score: 7.0, answers: Object.fromEntries(qz1q.map((q) => [q.id, "2"])), submittedAt: new Date() } });

  // ── 9. DOCUMENTS ─────────────────────────────
  await prisma.document.create({ data: { id: "doc-001", title: "Đề cương ôn tập Toán 10 HK1", description: "Tài liệu ôn tập HK1 cho tất cả lớp", fileUrl: "https://pub-xxx.r2.dev/de-cuong-toan-10.pdf", fileName: "de-cuong-toan-10.pdf", fileType: "pdf", category: "Toán học", published: true } });
  await prisma.document.create({ data: { id: "doc-002", title: "Bài tập Vật lý nâng cao 10A1", description: "Chỉ dành cho 10A1", fileUrl: "https://pub-xxx.r2.dev/vat-ly-10a1.pdf", fileName: "vat-ly-10a1.pdf", fileType: "pdf", category: "Vật lý", published: true, classVisibility: { create: { classId: c1.id } } } });
  await prisma.document.create({ data: { id: "doc-003", title: "Đề thi thử chưa hoàn thiện", description: "Đang soạn", fileUrl: "https://pub-xxx.r2.dev/de-thi-draft.pdf", fileName: "de-thi-draft.pdf", fileType: "pdf", category: "Chung", published: false } });

  // ── 10. CALENDAR / EVENT ──────────────────────
  await prisma.calendar.create({ data: { id: "cal-001", name: "Lịch giảng dạy", ownerId: t1.id } });
  await prisma.calendar.create({ data: { id: "cal-002", name: "Lịch cá nhân", ownerId: a1.id } });
  const evt = await prisma.event.create({
    data: {
      id: "evt-001", title: "Họp tổ chuyên môn Toán", startTime: g(1), endTime: g(1), isAllDay: true,
      calendarId: "cal-001", ownerId: t1.id, color: "#4285F4", recurrenceRule: "FREQ=WEEKLY;BYDAY=MO;COUNT=10",
      participants: {
        create: [
          { userId: t2.id, responseStatus: "ACCEPTED", role: "ATTENDEE" },
          { userId: t3.id, responseStatus: "DECLINED", role: "ATTENDEE" },
          { userId: a1.id, responseStatus: "PENDING", role: "ORGANIZER" },
        ],
      },
    },
  });
  await prisma.eventException.create({ data: { eventId: "evt-001", originalStart: g(8), recurrenceId: "rec-inst-001", status: "CANCELLED" } });
  await prisma.reminder.create({ data: { eventId: "evt-001", method: "POPUP", minutesBefore: 30 } });
  await prisma.reminder.create({ data: { eventId: "evt-001", method: "EMAIL", minutesBefore: 1440 } });

  // ── 11. COURSE / MODULE / LESSON / ENROLLMENT ─
  const crs = await prisma.course.create({
    data: {
      title: "Luyện thi THPT Quốc gia môn Toán", level: 12, published: true,
      modules: {
        create: [
          { title: "Chương 1: Khảo sát hàm số", order: 1, lessons: { create: [{ title: "Bài 1: Tính đơn điệu", order: 1 }, { title: "Bài 2: Cực trị", order: 2 }] } },
          { title: "Chương 2: Mũ và Logarit", order: 2, lessons: { create: [{ title: "Bài 3: Lũy thừa", order: 1 }, { title: "Bài 4: Logarit", order: 2 }] } },
        ],
      },
    },
  });
  // CASE: hoàn thành 100%
  await prisma.enrollment.create({ data: { studentId: sp[0], courseId: crs.id } });
  // CASE: 0%
  await prisma.enrollment.create({ data: { studentId: sp[1], courseId: crs.id } });

  // ── 12. TUITION ──────────────────────────
  // Fee thay đổi giữa kỳ
  await prisma.tuitionFeeSetting.create({ data: { id: "tfs-001", pricePerPeriod: 15000, updatedBy: a1.id, updatedAt: new Date(yr, mo - 2, 1) } });
  await prisma.tuitionFeeSetting.create({ data: { id: "tfs-002", pricePerPeriod: 18000, updatedBy: a1.id, updatedAt: new Date(yr, mo, 1) } });
  // Đã đóng đủ
  await prisma.tuition.create({ data: { id: "tui-001", studentId: sp[0], classId: c1.id, month: mo + 1, year: yr, periods: 24, amount: 432000, paid: 432000, status: "PAID" } });
  await prisma.tuitionPayment.create({ data: { tuitionId: "tui-001", studentId: sp[0], amount: 432000, paidAt: new Date(yr, mo, 5), method: "TRANSFER", note: "Đóng đủ", recordedBy: a1.id } });
  // Đóng thiếu (partial + nhiều đợt)
  await prisma.tuition.create({ data: { id: "tui-002", studentId: sp[1], classId: c1.id, month: mo + 1, year: yr, periods: 24, amount: 432000, paid: 200000, status: "PARTIAL" } });
  await prisma.tuitionPayment.create({ data: { tuitionId: "tui-002", studentId: sp[1], amount: 100000, paidAt: new Date(yr, mo, 10), method: "CASH", note: "Đợt 1", recordedBy: a1.id } });
  await prisma.tuitionPayment.create({ data: { tuitionId: "tui-002", studentId: sp[1], amount: 100000, paidAt: new Date(yr, mo, 15), method: "TRANSFER", note: "Đợt 2", recordedBy: a1.id } });
  // Chưa đóng
  await prisma.tuition.create({ data: { id: "tui-003", studentId: sp[2], classId: c1.id, month: mo + 1, year: yr, periods: 24, amount: 432000, paid: 0, status: "PENDING" } });
  // Tuition sai lệch so với thực tế
  await prisma.tuition.create({ data: { id: "tui-004", studentId: sp[3], classId: c1.id, month: mo + 1, year: yr, periods: 24, amount: 432000, paid: 0, status: "PENDING" } });
  await prisma.attendance.create({ data: { studentId: sp[3], date: g(-3), status: "ABSENT" } });
  await prisma.attendance.create({ data: { studentId: sp[3], date: g(-2), status: "ABSENT" } });
  await prisma.attendance.create({ data: { studentId: sp[3], date: g(-1), status: "ABSENT" } });
  // Tháng trước (tính theo giá cũ)
  await prisma.tuition.create({ data: { id: "tui-005", studentId: sp[0], classId: c1.id, month: mo, year: yr, periods: 20, amount: 300000, paid: 300000, status: "PAID" } });
  await prisma.tuitionPayment.create({ data: { tuitionId: "tui-005", studentId: sp[0], amount: 300000, paidAt: new Date(yr, mo - 1, 5), method: "CASH", recordedBy: a1.id } });

  console.log("\n✅ Seed complete!");
  console.log("📊 Counts:", {
    users: await prisma.user.count(),
    classes: await prisma.class.count(),
    scheduleSeries: await prisma.scheduleSeries.count(),
    attendances: await prisma.attendance.count(),
    grades: await prisma.grade.count(),
    quizzes: await prisma.quiz.count(),
    questions: await prisma.question.count(),
    documents: await prisma.document.count(),
    events: await prisma.event.count(),
    tuitions: await prisma.tuition.count(),
    payments: await prisma.tuitionPayment.count(),
  });
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
