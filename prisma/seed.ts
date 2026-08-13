/**
 * prisma/seed.ts
 * ────────────────────────────────────────────────────────────────────────
 * Seed data cho EduWeb — dùng để chạy automation test (Vitest) trên DB test
 * (Neon Postgres). Script này KHÔNG dùng cho production.
 *
 * Cài đặt cần thiết:
 *   npm i -D bcryptjs @types/bcryptjs tsx
 *   package.json:  "prisma": { "seed": "tsx prisma/seed.ts" }
 * Chạy:
 *   npx prisma db seed
 *
 * ────────────────────────────────────────────────────────────────────────
 * DANH SÁCH EDGE CASE ĐÃ CÀI SẴN (đọc trước khi viết test):
 *
 *  [Schedule/ScheduleSeries]
 *   - 1 ScheduleSeries endDate = null (lặp vô hạn)
 *   - 1 ScheduleSeries đã kết thúc (endDate ở quá khứ)
 *   - 2 ScheduleSeries TRÙNG teacherId + dayOfWeek + giờ overlap (2 lớp khác
 *     nhau) → test logic phát hiện xung đột lịch (nếu có)
 *   - 1 Schedule (hệ cũ) có recurrenceGroupId để test khả năng đọc song song
 *     2 hệ lịch cũ/mới
 *
 *  [ScheduleException]
 *   - 1 exception MODIFIED (đổi phòng + giờ)
 *   - 1 exception CANCELLED
 *   - 1 exception có rescheduledDate (dời ngày học)
 *
 *  [HomeworkSubmission / Grade]
 *   - 1 submission nộp trễ (submittedAt > homeworkDueDate)
 *   - 1 submission đã chấm điểm + liên kết 1-1 sang Grade
 *   - 1 submission CHƯA chấm (grade = null) — test trạng thái "đang chờ chấm"
 *
 *  [Attendance / Tuition — liên quan tới known gap "tuition không tự tính
 *   lại khi học sinh nghỉ"]
 *   - 1 học sinh có streak 3 buổi ABSENT liên tiếp
 *   - 1 học sinh có buổi EXCUSED trong tháng đã có Tuition status=PAID
 *     → dùng để viết test tái hiện gap: excused KHÔNG tự trừ periods trên
 *     Tuition đã tạo trước đó (theo quyết định: chỉ EXCUSED mới ảnh hưởng
 *     học phí, nhưng việc tự động recalculate chưa được implement)
 *
 *  [Quiz — liên quan tới known gap "không validate endTime khi nộp bài"]
 *   - Quiz A: deadline ở QUÁ KHỨ, có 1 QuizSubmission với isLate=true nộp
 *     SAU deadline nhiều giờ → dùng để test/tái hiện lỗ hổng gian lận
 *   - Quiz B: deadline = null (không đóng đề)
 *   - Quiz C: isPublic = true, có 1 QuizSubmission GUEST (studentId=null,
 *     guestName có giá trị)
 *
 *  [Tuition / TuitionPayment / PaymentLink — chống trùng thanh toán]
 *   - 1 Tuition trạng thái PARTIAL (paid < amount)
 *   - 1 Tuition trạng thái PAID đầy đủ, thanh toán qua PAYOS có
 *     payosReference (dùng để test insert trùng payosReference phải bị
 *     chặn bởi unique constraint — webhook gọi 2 lần)
 *   - 1 PaymentLink status=PAID nhưng tuitionId=null, có sẵn month/year
 *     → mô phỏng trường hợp Tuition gốc bị xoá TRƯỚC KHI webhook xử lý
 *     xong, dùng để test logic fallback tạo lại Tuition từ month/year
 *   - 1 PaymentLink status=CANCELLED (người dùng hủy quét mã)
 *   - 1 StudentCredit dương (dư tiết) và 1 StudentCredit âm (nợ tiết)
 *
 *  [Enrollment / Course]
 *   - 1 Course published=true, 1 Course published=false (draft)
 *   - Dữ liệu sẵn sàng để test unique constraint (studentId, courseId) khi
 *     cố tình enroll trùng trong test
 *
 *  [Document]
 *   - 1 Document published + giới hạn hiển thị theo lớp (DocumentClassVisibility)
 *   - 1 Document chưa published
 *   - 1 Document createdById = null (tài liệu hệ thống/admin, không gắn GV)
 *     → test rule "GV chỉ sửa được doc của mình" phải cho phép admin bỏ qua
 *
 *  [Calendar/Event]
 *   - 1 Event lặp theo RRULE hàng tuần, có 1 EventException (đổi giờ) và
 *     1 occurrence bị CANCELLED qua EventException.status
 *   - EventParticipant với đủ role (ORGANIZER/ATTENDEE) và response
 *     (PENDING/ACCEPTED/DECLINED)
 *   - Reminder với cả 3 method (POPUP/EMAIL/NOTIFICATION)
 *
 *  [Quan hệ optional / SetNull]
 *   - 1 Class KHÔNG có formTeacherId (chưa phân công GVCN)
 *   - 1 StudentProfile KHÔNG có parentId (học sinh chưa gắn phụ huynh)
 *   - 1 Subject KHÔNG có giáo viên nào dạy (chưa phân công)
 * ────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

// Prisma 7 yêu cầu driver adapter (schema.prisma không có `url` trong datasource).
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Mốc thời gian tham chiếu cố định để dữ liệu seed luôn nhất quán giữa các
// lần chạy test (tránh flaky test do phụ thuộc vào ngày giờ thực tế).
const TODAY = new Date("2026-08-09T00:00:00.000Z");
const SEMESTER_START = new Date("2026-01-05T00:00:00.000Z"); // Thứ Hai
const SEMESTER_END = new Date("2026-05-30T00:00:00.000Z");
const DEFAULT_PASSWORD = "Test@1234";

// ── Helpers ────────────────────────────────────────────────────────────
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}
function isoDow(d: Date): number {
  const g = d.getUTCDay(); // 0=CN...6=Thứ Bảy
  return g === 0 ? 7 : g; // quy ước schema: 1=Thứ Hai ... 7=Chủ Nhật
}
function nextOccurrence(from: Date, dow: number): Date {
  let d = new Date(from);
  while (isoDow(d) !== dow) d = addDays(d, 1);
  return d;
}
function hashPw(pw: string) {
  return bcrypt.hashSync(pw, 10);
}

async function clearDatabase() {
  // Xoá theo thứ tự ngược phụ thuộc khoá ngoại
  await prisma.paymentLink.deleteMany();
  await prisma.tuitionPayment.deleteMany();
  await prisma.tuition.deleteMany();
  await prisma.studentCredit.deleteMany();
  await prisma.tuitionFeeSetting.deleteMany();

  await prisma.reminder.deleteMany();
  await prisma.eventParticipant.deleteMany();
  await prisma.eventException.deleteMany();
  await prisma.event.deleteMany();
  await prisma.calendar.deleteMany();

  await prisma.documentClassVisibility.deleteMany();
  await prisma.document.deleteMany();

  await prisma.quizSubmission.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();

  await prisma.enrollment.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();

  await prisma.grade.deleteMany();
  await prisma.homeworkSubmission.deleteMany();
  await prisma.attendance.deleteMany();

  await prisma.scheduleException.deleteMany();
  await prisma.scheduleSeries.deleteMany();
  await prisma.schedule.deleteMany();

  await prisma.room.deleteMany();

  await prisma.studentProfile.deleteMany();
  await prisma.parentProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.adminProfile.deleteMany();

  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log("🧹 Clearing existing data...");
  await clearDatabase();

  // ════════════════════════════════════════════════════════════════════
  // 1. TÀI KHOẢN & HỒ SƠ
  // ════════════════════════════════════════════════════════════════════
  console.log("👤 Seeding users & profiles...");

  const passwordHash = hashPw(DEFAULT_PASSWORD);

  // --- Admins (3) ---
  const adminData = [
    { name: "Nguyễn Thị Hạnh", email: "admin1@eduweb.vn" },
    { name: "Trần Văn Bảo", email: "admin2@eduweb.vn" },
    { name: "Lê Thị Ngọc", email: "admin3@eduweb.vn" },
  ];
  const admins = [];
  for (const a of adminData) {
    const user = await prisma.user.create({
      data: {
        email: a.email,
        passwordHash,
        name: a.name,
        role: "ADMIN",
        adminProfile: { create: {} },
      },
      include: { adminProfile: true },
    });
    admins.push(user);
  }

  // --- Root admin (bất khả xâm phạm) ---
  // Không thể tự xoá, không thể bị admin thường xoá, là người duy nhất được
  // xoá các tài khoản admin khác. Email/mật khẩu được chỉ định riêng.
  const rootUser = await prisma.user.create({
    data: {
      email: "admin@eduweb.vn",
      passwordHash: bcrypt.hashSync("hungcuong123", 10),
      name: "Root Admin",
      role: "ADMIN",
      isRoot: true,
      adminProfile: { create: {} },
    },
    include: { adminProfile: true },
  });
  admins.push(rootUser);

  // --- Teachers (6), mỗi người gắn với 1 môn "chính", 1 giáo viên dạy 2 môn ---
  const teacherData = [
    { name: "Nguyễn Văn An", email: "teacher.toan@eduweb.vn" },
    { name: "Trần Thị Bình", email: "teacher.van@eduweb.vn" },
    { name: "Lê Hoàng Cường", email: "teacher.anh@eduweb.vn" },
    { name: "Phạm Thị Dung", email: "teacher.ly@eduweb.vn" },
    { name: "Hoàng Văn Em", email: "teacher.hoa@eduweb.vn" },
    { name: "Vũ Thị Hoa", email: "teacher.sinh@eduweb.vn" },
  ];
  const teacherProfiles = [];
  for (const t of teacherData) {
    const user = await prisma.user.create({
      data: {
        email: t.email,
        passwordHash,
        name: t.name,
        role: "TEACHER",
        teacherProfile: { create: {} },
      },
      include: { teacherProfile: true },
    });
    teacherProfiles.push(user.teacherProfile!);
  }

  // --- Parents (10) ---
  const parentNames = [
    "Đặng Văn Phúc", "Bùi Thị Lan", "Đỗ Văn Sơn", "Ngô Thị Thu",
    "Dương Văn Hải", "Phan Thị Mai", "Vũ Văn Long", "Trịnh Thị Nga",
    "Lý Văn Tùng", "Hồ Thị Kim",
  ];
  const parentProfiles = [];
  for (let i = 0; i < parentNames.length; i++) {
    const user = await prisma.user.create({
      data: {
        email: `parent${i + 1}@eduweb.vn`,
        passwordHash,
        name: parentNames[i],
        role: "PARENT",
        parentProfile: { create: {} },
      },
      include: { parentProfile: true },
    });
    parentProfiles.push(user.parentProfile!);
  }

  // ════════════════════════════════════════════════════════════════════
  // 2. LỚP HỌC & MÔN HỌC
  // ════════════════════════════════════════════════════════════════════
  console.log("🏫 Seeding subjects & classes...");

  const subjectData = [
    { name: "Toán", code: "MATH101" },
    { name: "Ngữ Văn", code: "LIT101" },
    { name: "Tiếng Anh", code: "ENG101" },
    { name: "Vật Lý", code: "PHY101" },
    { name: "Hóa Học", code: "CHEM101" },
    { name: "Sinh Học", code: "BIO101" },
    { name: "Lịch Sử", code: "HIST101" },
    { name: "Địa Lý", code: "GEO101" },
    { name: "GDCD", code: "CIVIC101" }, // edge case: sẽ KHÔNG gắn giáo viên nào
  ];
  const subjects: Record<string, Awaited<ReturnType<typeof prisma.subject.create>>> = {};
  for (const s of subjectData) {
    subjects[s.code] = await prisma.subject.create({ data: s });
  }

  // Gán giáo viên ↔ môn (many-to-many). Teacher[0] dạy 2 môn (Toán + Tin-ish/Lý phụ)
  await prisma.teacherProfile.update({
    where: { id: teacherProfiles[0].id },
    data: { subjects: { connect: [{ id: subjects["MATH101"].id }, { id: subjects["HIST101"].id }] } },
  });
  await prisma.teacherProfile.update({
    where: { id: teacherProfiles[1].id },
    data: { subjects: { connect: [{ id: subjects["LIT101"].id }] } },
  });
  await prisma.teacherProfile.update({
    where: { id: teacherProfiles[2].id },
    data: { subjects: { connect: [{ id: subjects["ENG101"].id }] } },
  });
  await prisma.teacherProfile.update({
    where: { id: teacherProfiles[3].id },
    data: { subjects: { connect: [{ id: subjects["PHY101"].id }] } },
  });
  await prisma.teacherProfile.update({
    where: { id: teacherProfiles[4].id },
    data: { subjects: { connect: [{ id: subjects["CHEM101"].id }] } },
  });
  await prisma.teacherProfile.update({
    where: { id: teacherProfiles[5].id },
    data: { subjects: { connect: [{ id: subjects["BIO101"].id }, { id: subjects["GEO101"].id }] } },
  });
  // GDCD (CIVIC101) cố tình KHÔNG gán giáo viên nào — edge case optional relation

  // --- Classes (6) — lớp cuối cố tình KHÔNG có formTeacherId ---
  const classDefs = [
    { name: "10A1", gradeLevel: 10, formTeacherId: teacherProfiles[0].id },
    { name: "10A2", gradeLevel: 10, formTeacherId: teacherProfiles[1].id },
    { name: "11A1", gradeLevel: 11, formTeacherId: teacherProfiles[2].id },
    { name: "11A2", gradeLevel: 11, formTeacherId: teacherProfiles[3].id },
    { name: "12A1", gradeLevel: 12, formTeacherId: teacherProfiles[4].id },
    { name: "12A2", gradeLevel: 12, formTeacherId: null }, // edge case
  ];
  const classes: Record<string, Awaited<ReturnType<typeof prisma.class.create>>> = {};
  for (const c of classDefs) {
    classes[c.name] = await prisma.class.create({ data: c });
  }

  // --- Rooms (5) ---
  const roomNames = ["Phòng 101", "Phòng 102", "Phòng 203", "Phòng Lab Lý", "Phòng Lab Hóa"];
  const rooms = [];
  for (const name of roomNames) {
    rooms.push(await prisma.room.create({ data: { name, capacity: 40 } }));
  }

  // --- Students (30, 5/lớp) + gán parentId (1 học sinh KHÔNG có phụ huynh) ---
  const familyNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Vũ", "Đặng", "Bùi", "Đỗ"];
  const givenNames = ["An", "Bình", "Chi", "Duy", "Giang", "Hà", "Khang", "Linh", "Minh", "Nam",
    "Oanh", "Phúc", "Quân", "Trang", "Vy", "Yến", "Bảo", "Châu", "Đạt", "Hằng",
    "Khôi", "Lam", "Nhi", "Phong", "Quỳnh", "Thảo", "Tú", "Uyên", "Vinh", "Xuân"];

  const classNamesOrdered = ["10A1", "10A2", "11A1", "11A2", "12A1", "12A2"];
  const students: Awaited<ReturnType<typeof prisma.studentProfile.create>>[] = [];
  let studentCounter = 0;
  for (const className of classNamesOrdered) {
    for (let i = 0; i < 5; i++) {
      const idx = studentCounter;
      const fullName = `${familyNames[idx % familyNames.length]} Văn ${givenNames[idx]}`;
      // Edge case: học sinh đầu tiên (idx===0) KHÔNG gắn phụ huynh
      const parentId = idx === 0 ? undefined : parentProfiles[idx % parentProfiles.length].id;
      const user = await prisma.user.create({
        data: {
          email: `student${idx + 1}@eduweb.vn`,
          passwordHash,
          name: fullName,
          role: "STUDENT",
          studentProfile: {
            create: {
              parentId,
              classes: { connect: [{ id: classes[className].id }] },
            },
          },
        },
        include: { studentProfile: true },
      });
      students.push(user.studentProfile!);
      studentCounter++;
    }
  }
  // Edge case bổ sung: học sinh cuối cùng học thêm 1 lớp phụ (m2m thật sự)
  await prisma.studentProfile.update({
    where: { id: students[students.length - 1].id },
    data: { classes: { connect: [{ id: classes["11A1"].id }] } },
  });

  const studentsByClass: Record<string, typeof students> = {};
  classNamesOrdered.forEach((cn, ci) => {
    studentsByClass[cn] = students.slice(ci * 5, ci * 5 + 5);
  });

  // ════════════════════════════════════════════════════════════════════
  // 3. LỊCH HỌC — HỆ CŨ (Schedule)
  // ════════════════════════════════════════════════════════════════════
  console.log("🗓️  Seeding legacy Schedule...");

  const recurGroupId = "legacy-group-10a1-toan";
  for (let week = 0; week < 3; week++) {
    await prisma.schedule.create({
      data: {
        classId: classes["10A1"].id,
        subjectId: subjects["MATH101"].id,
        teacherId: teacherProfiles[0].id,
        dayOfWeek: 2,
        startTime: "07:00",
        endTime: "08:30",
        room: rooms[0].name,
        date: addDays(nextOccurrence(SEMESTER_START, 2), week * 7),
        recurrenceGroupId: recurGroupId,
      },
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // 4. LỊCH HỌC — HỆ MỚI (ScheduleSeries + ScheduleException)
  // ════════════════════════════════════════════════════════════════════
  console.log("🗓️  Seeding ScheduleSeries & ScheduleException...");

  // Quiz dùng làm bài tập về nhà (tạo trước, quiz thật sự seed đầy đủ ở mục 6)
  const homeworkQuizPlaceholder = await prisma.quiz.create({
    data: {
      title: "Bài tập về nhà tuần 1 - Đạo hàm",
      duration: 30,
      passingScore: 5,
      subjectId: subjects["MATH101"].id,
      teacherId: teacherProfiles[0].id,
      classId: classes["10A1"].id,
    },
  });

  // Series 1: Toán 10A1 - Thứ Hai, LẶP VÔ HẠN (endDate = null)
  const series10A1Math = await prisma.scheduleSeries.create({
    data: {
      classId: classes["10A1"].id,
      subjectId: subjects["MATH101"].id,
      teacherId: teacherProfiles[0].id,
      dayOfWeek: 1,
      startTime: "07:00",
      endTime: "08:30",
      room: rooms[0].name,
      startDate: SEMESTER_START,
      endDate: null,
      materials: "SGK Toán 10, Chương 1",
      homework: "Làm bài tập trang 15-16",
      homeworkDueDate: addDays(nextOccurrence(SEMESTER_START, 1), 7),
      homeworkQuizId: homeworkQuizPlaceholder.id,
    },
  });

  // Series 2: Văn 10A2 - Thứ Ba, ĐÃ KẾT THÚC (endDate quá khứ so với TODAY)
  const series10A2Lit = await prisma.scheduleSeries.create({
    data: {
      classId: classes["10A2"].id,
      subjectId: subjects["LIT101"].id,
      teacherId: teacherProfiles[1].id,
      dayOfWeek: 2,
      startTime: "09:00",
      endTime: "10:30",
      room: rooms[1].name,
      startDate: SEMESTER_START,
      endDate: addDays(SEMESTER_START, 60), // kết thúc giữa kỳ, trước TODAY
    },
  });

  // Series 3 & 4: XUNG ĐỘT LỊCH cố ý — CÙNG giáo viên (teacherProfiles[2]),
  // CÙNG dayOfWeek=3, giờ overlap nhau, nhưng 2 lớp khác nhau.
  const series11A1English = await prisma.scheduleSeries.create({
    data: {
      classId: classes["11A1"].id,
      subjectId: subjects["ENG101"].id,
      teacherId: teacherProfiles[2].id,
      dayOfWeek: 3,
      startTime: "08:00",
      endTime: "09:30",
      room: rooms[2].name,
      startDate: SEMESTER_START,
      endDate: SEMESTER_END,
    },
  });
  const series11A2EnglishConflict = await prisma.scheduleSeries.create({
    data: {
      classId: classes["11A2"].id,
      subjectId: subjects["ENG101"].id,
      teacherId: teacherProfiles[2].id, // TRÙNG giáo viên với series trên
      dayOfWeek: 3, // TRÙNG thứ
      startTime: "09:00", // overlap 08:00-09:30 vs 09:00-10:30
      endTime: "10:30",
      room: rooms[2].name,
      startDate: SEMESTER_START,
      endDate: SEMESTER_END,
    },
  });

  // Series 5: Lý 12A1 - Thứ Năm (dùng cho attendance/tuition edge cases bên dưới)
  const series12A1Physics = await prisma.scheduleSeries.create({
    data: {
      classId: classes["12A1"].id,
      subjectId: subjects["PHY101"].id,
      teacherId: teacherProfiles[3].id,
      dayOfWeek: 4,
      startTime: "13:00",
      endTime: "14:30",
      room: rooms[3].name,
      startDate: SEMESTER_START,
      endDate: null,
    },
  });

  // --- ScheduleException cho series10A1Math ---
  const occ3 = addDays(nextOccurrence(SEMESTER_START, 1), 14); // buổi thứ 3

  // Exception 1: MODIFIED — đổi phòng + giờ
  await prisma.scheduleException.create({
    data: {
      seriesId: series10A1Math.id,
      originalDate: occ3,
      status: "MODIFIED",
      room: rooms[3].name,
      startTime: "07:30",
      endTime: "09:00",
      materials: "Đổi sang phòng Lab do bảo trì phòng 101",
    },
  });

  // Exception 2: CANCELLED — nghỉ học (lễ)
  const occ5 = addDays(nextOccurrence(SEMESTER_START, 1), 28);
  await prisma.scheduleException.create({
    data: {
      seriesId: series10A1Math.id,
      originalDate: occ5,
      status: "CANCELLED",
    },
  });

  // Exception 3: có rescheduledDate — dời buổi học sang ngày khác
  const occ7 = addDays(nextOccurrence(SEMESTER_START, 1), 42);
  await prisma.scheduleException.create({
    data: {
      seriesId: series10A1Math.id,
      originalDate: occ7,
      status: "MODIFIED",
      rescheduledDate: addDays(occ7, 2), // dời từ Thứ Hai sang Thứ Tư cùng tuần
    },
  });

  // ════════════════════════════════════════════════════════════════════
  // 5. ĐIỂM DANH & ĐIỂM
  // ════════════════════════════════════════════════════════════════════
  console.log("✅ Seeding attendance & grades...");

  const s12A1 = studentsByClass["12A1"];

  // Điểm danh bình thường cho vài học sinh 10A1 (4 buổi gần nhất theo series)
  const s10A1 = studentsByClass["10A1"];
  const attendanceDates = [0, 7, 14, 21].map((n) => addDays(nextOccurrence(SEMESTER_START, 1), n));
  for (const student of s10A1.slice(1, 4)) {
    for (const d of attendanceDates) {
      await prisma.attendance.create({
        data: { studentId: student.id, date: d, status: "PRESENT" },
      });
    }
  }

  // Edge case: học sinh s10A1[0] có STREAK 3 buổi ABSENT liên tiếp
  const streakStudent = s10A1[0];
  for (const d of attendanceDates.slice(0, 3)) {
    await prisma.attendance.create({
      data: {
        studentId: streakStudent.id,
        date: d,
        status: "ABSENT",
        remarks: "Nghỉ không phép - chưa rõ lý do",
      },
    });
  }

  // Edge case: học sinh 12A1[0] có buổi EXCUSED trong tháng đã có Tuition PAID
  // (dùng cho test tái hiện gap "tuition không tự recalculate khi nghỉ")
  const excusedStudent = s12A1[0];
  const physicsOcc = nextOccurrence(SEMESTER_START, 4); // Thứ Năm đầu kỳ, tháng 1/2026
  await prisma.attendance.create({
    data: {
      studentId: excusedStudent.id,
      date: physicsOcc,
      status: "EXCUSED",
      remarks: "Xin phép nghỉ ốm, có giấy bác sĩ",
    },
  });

  // Grades — vài điểm QUIZ/MIDTERM/FINAL bình thường cho 10A1
  for (const student of s10A1.slice(1, 4)) {
    await prisma.grade.create({
      data: {
        studentId: student.id,
        subjectId: subjects["MATH101"].id,
        teacherId: teacherProfiles[0].id,
        type: "QUIZ",
        score: 7.5,
        weight: 20,
      },
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // HomeworkSubmission (thuộc series10A1Math) + Grade liên kết 1-1
  // ════════════════════════════════════════════════════════════════════
  console.log("📝 Seeding homework submissions...");

  const hwInstanceDate = nextOccurrence(SEMESTER_START, 1);

  // Submission 1: nộp ĐÚNG hạn, ĐÃ chấm điểm, liên kết Grade 1-1
  const hwOnTime = await prisma.homeworkSubmission.create({
    data: {
      seriesId: series10A1Math.id,
      instanceDate: hwInstanceDate,
      studentId: s10A1[1].id,
      fileUrl: "https://storage.eduweb.vn/hw/hw-ontime-1.pdf",
      fileName: "baitap_dao_ham.pdf",
      submittedAt: addDays(hwInstanceDate, 6), // hạn là +7 ngày, nộp trước 1 ngày
      grade: 9.0,
      feedback: "Làm tốt, trình bày rõ ràng.",
    },
  });
  await prisma.grade.create({
    data: {
      studentId: s10A1[1].id,
      subjectId: subjects["MATH101"].id,
      teacherId: teacherProfiles[0].id,
      homeworkSubmissionId: hwOnTime.id,
      type: "HOMEWORK",
      score: 9.0,
      weight: 10,
    },
  });

  // Submission 2: nộp TRỄ hạn (submittedAt > homeworkDueDate)
  await prisma.homeworkSubmission.create({
    data: {
      seriesId: series10A1Math.id,
      instanceDate: hwInstanceDate,
      studentId: s10A1[2].id,
      fileUrl: "https://storage.eduweb.vn/hw/hw-late-1.pdf",
      fileName: "baitap_dao_ham_tre.pdf",
      submittedAt: addDays(hwInstanceDate, 9), // trễ 2 ngày so với hạn +7
    },
  });

  // Submission 3: nộp đúng hạn nhưng CHƯA được chấm (grade = null)
  await prisma.homeworkSubmission.create({
    data: {
      seriesId: series10A1Math.id,
      instanceDate: hwInstanceDate,
      studentId: s10A1[3].id,
      fileUrl: "https://storage.eduweb.vn/hw/hw-pending-1.pdf",
      fileName: "baitap_dao_ham_cho_cham.pdf",
      submittedAt: addDays(hwInstanceDate, 5),
    },
  });

  // ════════════════════════════════════════════════════════════════════
  // 6. KHÓA HỌC & BÀI GIẢNG (hệ cũ)
  // ════════════════════════════════════════════════════════════════════
  console.log("📚 Seeding courses...");

  const coursePublished = await prisma.course.create({
    data: {
      title: "Nhập môn Đại số tuyến tính",
      description: "Khóa học cơ bản về ma trận, vector và hệ phương trình.",
      level: 1,
      published: true,
      modules: {
        create: [
          {
            title: "Chương 1: Ma trận",
            order: 1,
            lessons: {
              create: [
                { title: "Bài 1: Định nghĩa ma trận", order: 1, content: "Nội dung bài học..." },
                { title: "Bài 2: Phép cộng và nhân ma trận", order: 2, videoUrl: "https://video.eduweb.vn/v1" },
              ],
            },
          },
          {
            title: "Chương 2: Vector",
            order: 2,
            lessons: {
              create: [{ title: "Bài 1: Không gian vector", order: 1 }],
            },
          },
        ],
      },
    },
  });

  // Edge case: course chưa published (draft), không nên hiển thị cho học sinh
  const courseDraft = await prisma.course.create({
    data: {
      title: "Chuyên đề Hóa hữu cơ nâng cao (đang soạn)",
      level: 3,
      published: false,
      modules: { create: [{ title: "Chương 1 (nháp)", order: 1 }] },
    },
  });

  // Enrollment — vài học sinh đăng ký course đã published
  for (const student of s10A1.slice(0, 3)) {
    await prisma.enrollment.create({
      data: { studentId: student.id, courseId: coursePublished.id },
    });
  }
  // (Không enroll courseDraft — dùng courseDraft.id trong test để đảm bảo
  // API chặn enroll vào course chưa published nếu có rule đó)
  void courseDraft;

  // ════════════════════════════════════════════════════════════════════
  // 7. QUIZ
  // ════════════════════════════════════════════════════════════════════
  console.log("🧩 Seeding quizzes...");

  // Quiz A: deadline QUÁ KHỨ, dùng để test nộp trễ / lỗ hổng validate endTime
  const quizPastDeadline = await prisma.quiz.create({
    data: {
      title: "Kiểm tra 15 phút - Chương 1 Vật Lý",
      description: "Kiểm tra nhanh kiến thức chương Động học.",
      duration: 15,
      passingScore: 5,
      deadline: addDays(TODAY, -3), // đã đóng đề 3 ngày trước
      answerVisibility: "AFTER_DEADLINE",
      subjectId: subjects["PHY101"].id,
      teacherId: teacherProfiles[3].id,
      classId: classes["12A1"].id,
      questions: {
        create: [
          {
            text: "Đơn vị của vận tốc trong hệ SI là gì?",
            type: "MULTIPLE_CHOICE",
            options: ["m/s", "km/h", "m/s²", "N"],
            correctAnswer: "m/s",
            score: 5,
          },
          {
            text: "Công thức tính quãng đường chuyển động thẳng đều?",
            type: "MULTIPLE_CHOICE",
            options: ["s = v·t", "s = v/t", "s = v + t", "s = v²·t"],
            correctAnswer: "s = v·t",
            score: 5,
          },
        ],
      },
    },
    include: { questions: true },
  });

  // Submission ĐÚNG HẠN
  await prisma.quizSubmission.create({
    data: {
      studentId: s12A1[1].id,
      quizId: quizPastDeadline.id,
      score: 8,
      answers: { [quizPastDeadline.questions[0].id]: "m/s", [quizPastDeadline.questions[1].id]: "s = v·t" },
      submittedAt: addDays(TODAY, -4), // nộp trước hạn đóng đề
      isLate: false,
    },
  });

  // Edge case: submission NỘP TRỄ NHIỀU GIỜ sau deadline nhưng vẫn được ghi
  // nhận (isLate=true) — vì hệ thống hiện KHÔNG validate endTime khi lưu,
  // đây chính là gap đã ghi nhận trong TEST_CHECKLIST trước đó.
  await prisma.quizSubmission.create({
    data: {
      studentId: s12A1[2].id,
      quizId: quizPastDeadline.id,
      score: 10,
      answers: { [quizPastDeadline.questions[0].id]: "m/s", [quizPastDeadline.questions[1].id]: "s = v·t" },
      submittedAt: addDays(TODAY, -1), // nộp 2 ngày SAU deadline (-3)
      isLate: true,
    },
  });

  // Quiz B: deadline = null (không bao giờ đóng đề)
  await prisma.quiz.create({
    data: {
      title: "Ngân hàng câu hỏi ôn tập Hóa Học",
      duration: 45,
      passingScore: 5,
      deadline: null,
      subjectId: subjects["CHEM101"].id,
      teacherId: teacherProfiles[4].id,
      questions: {
        create: [
          {
            text: "Ký hiệu hóa học của Natri là gì?",
            type: "MULTIPLE_CHOICE",
            options: ["Na", "N", "Ni", "Ne"],
            correctAnswer: "Na",
            score: 10,
          },
        ],
      },
    },
  });

  // Quiz C: isPublic = true, cho phép GUEST làm bài (không cần đăng nhập)
  const quizPublic = await prisma.quiz.create({
    data: {
      title: "Trắc nghiệm thử sức - Tiếng Anh cơ bản",
      duration: 20,
      passingScore: 5,
      isPublic: true,
      subjectId: subjects["ENG101"].id,
      teacherId: teacherProfiles[2].id,
      questions: {
        create: [
          {
            text: "Choose the correct word: 'She ___ to school every day.'",
            type: "MULTIPLE_CHOICE",
            options: ["go", "goes", "going", "gone"],
            correctAnswer: "goes",
            score: 10,
          },
        ],
      },
    },
    include: { questions: true },
  });

  // Edge case: submission của KHÁCH (studentId = null, guestName có giá trị)
  await prisma.quizSubmission.create({
    data: {
      studentId: null,
      quizId: quizPublic.id,
      score: 10,
      answers: { [quizPublic.questions[0].id]: "goes" },
      guestName: "Khách vãng lai - Nguyễn Thị Khách",
      isLate: false,
    },
  });

  // ════════════════════════════════════════════════════════════════════
  // 8. TÀI LIỆU
  // ════════════════════════════════════════════════════════════════════
  console.log("📄 Seeding documents...");

  const docPublishedRestricted = await prisma.document.create({
    data: {
      title: "Đề cương ôn tập giữa kỳ - Toán 10",
      fileUrl: "https://storage.eduweb.vn/docs/decuong-toan10.pdf",
      fileName: "decuong-toan10.pdf",
      fileType: "pdf",
      fileSize: "1.2MB",
      category: "Đề cương",
      published: true,
      createdById: teacherProfiles[0].id,
      classVisibility: {
        create: [{ classId: classes["10A1"].id }, { classId: classes["10A2"].id }],
      },
    },
  });
  void docPublishedRestricted;

  // Edge case: tài liệu chưa published — không nên hiển thị cho học sinh
  await prisma.document.create({
    data: {
      title: "Giáo án Hóa 12 (bản nháp)",
      fileUrl: "https://storage.eduweb.vn/docs/giaoan-hoa12-draft.docx",
      fileName: "giaoan-hoa12-draft.docx",
      fileType: "docx",
      category: "Giáo án",
      published: false,
      createdById: teacherProfiles[4].id,
    },
  });

  // Edge case: tài liệu hệ thống, createdById = null (do admin đăng, không
  // gắn giáo viên nào) — test rule "GV chỉ sửa doc của mình" phải cho phép
  // admin thao tác trên các doc không có createdById.
  await prisma.document.create({
    data: {
      title: "Nội quy nhà trường 2026",
      fileUrl: "https://storage.eduweb.vn/docs/noiquy-2026.pdf",
      fileName: "noiquy-2026.pdf",
      fileType: "pdf",
      category: "Chung",
      published: true,
      createdById: null,
    },
  });

  // ════════════════════════════════════════════════════════════════════
  // 9. LỊCH & SỰ KIỆN (Calendar / Event)
  // ════════════════════════════════════════════════════════════════════
  console.log("📆 Seeding calendars & events...");

  const teacherUser0 = await prisma.user.findFirstOrThrow({ where: { teacherProfile: { id: teacherProfiles[0].id } } });
  const adminUser0 = admins[0];

  const staffCalendar = await prisma.calendar.create({
    data: { name: "Lịch họp giáo viên", ownerId: adminUser0.id, color: "#EA4335" },
  });
  const personalCalendar = await prisma.calendar.create({
    data: { name: "Lịch cá nhân - Thầy An", ownerId: teacherUser0.id },
  });
  void personalCalendar;

  // Event lặp hàng tuần theo RRULE
  const weeklyMeeting = await prisma.event.create({
    data: {
      title: "Họp giao ban tổ chuyên môn",
      description: "Họp định kỳ hàng tuần, tổ Tự nhiên",
      location: "Phòng họp A",
      startTime: new Date("2026-08-10T08:00:00.000Z"),
      endTime: new Date("2026-08-10T09:00:00.000Z"),
      recurrenceRule: "FREQ=WEEKLY;BYDAY=MO;COUNT=20",
      calendarId: staffCalendar.id,
      ownerId: adminUser0.id,
      status: "CONFIRMED",
      participants: {
        create: [
          { userId: adminUser0.id, role: "ORGANIZER", responseStatus: "ACCEPTED" },
          { userId: teacherUser0.id, role: "ATTENDEE", responseStatus: "PENDING" },
        ],
      },
      reminders: {
        create: [
          { method: "POPUP", minutesBefore: 10 },
          { method: "EMAIL", minutesBefore: 60 },
        ],
      },
    },
  });

  // Edge case: 1 occurrence bị đổi giờ (EventException MODIFIED-style)
  await prisma.eventException.create({
    data: {
      eventId: weeklyMeeting.id,
      originalStart: new Date("2026-08-17T08:00:00.000Z"),
      recurrenceId: "2026-08-17T08:00:00.000Z",
      startTime: new Date("2026-08-17T10:00:00.000Z"),
      endTime: new Date("2026-08-17T11:00:00.000Z"),
      location: "Phòng họp B (đổi phòng)",
    },
  });

  // Edge case: 1 occurrence bị HỦY hoàn toàn
  await prisma.eventException.create({
    data: {
      eventId: weeklyMeeting.id,
      originalStart: new Date("2026-08-24T08:00:00.000Z"),
      recurrenceId: "2026-08-24T08:00:00.000Z",
      status: "CANCELLED",
    },
  });

  // Event đơn lẻ, không lặp, có người từ chối tham gia
  const singleEvent = await prisma.event.create({
    data: {
      title: "Họp phụ huynh đầu năm - 10A1",
      startTime: new Date("2026-09-05T13:00:00.000Z"),
      endTime: new Date("2026-09-05T15:00:00.000Z"),
      calendarId: staffCalendar.id,
      ownerId: teacherUser0.id,
      participants: {
        create: [{ userId: teacherUser0.id, role: "ORGANIZER", responseStatus: "ACCEPTED" }],
      },
      reminders: { create: [{ method: "NOTIFICATION", minutesBefore: 30 }] },
    },
  });
  void singleEvent;

  // ════════════════════════════════════════════════════════════════════
  // 10. HỌC PHÍ & THANH TOÁN (PayOS)
  // ════════════════════════════════════════════════════════════════════
  console.log("💰 Seeding tuition & payments...");

  await prisma.tuitionFeeSetting.create({
    data: { pricePerPeriod: 15000, updatedBy: adminUser0.id },
  });

  // StudentCredit: 1 dư tiết (credit dương), 1 nợ tiết (credit âm)
  await prisma.studentCredit.create({
    data: { studentId: s10A1[1].id, classId: classes["10A1"].id, credit: 4 }, // dư 4 tiết
  });
  await prisma.studentCredit.create({
    data: { studentId: s10A1[2].id, classId: classes["10A1"].id, credit: -2 }, // nợ 2 tiết
  });

  // Tuition 1: PARTIAL — đã đóng một phần
  const tuitionPartial = await prisma.tuition.create({
    data: {
      studentId: s10A1[1].id,
      classId: classes["10A1"].id,
      month: 1,
      year: 2026,
      periods: 8,
      amount: 8 * 15000,
      paid: 60000,
      status: "PARTIAL",
    },
  });
  await prisma.tuitionPayment.create({
    data: {
      tuitionId: tuitionPartial.id,
      studentId: s10A1[1].id,
      amount: 60000,
      paidAt: addDays(TODAY, -20),
      method: "CASH",
      recordedBy: adminUser0.id,
    },
  });

  // Tuition 2: PAID đầy đủ qua PAYOS, có payosReference — dùng để test
  // unique constraint khi webhook PayOS gọi lại (duplicate delivery).
  const tuitionPaidPayos = await prisma.tuition.create({
    data: {
      studentId: excusedStudent.id, // trùng học sinh có buổi EXCUSED ở mục 5
      classId: classes["12A1"].id,
      month: 1,
      year: 2026,
      periods: 4,
      amount: 4 * 15000,
      paid: 4 * 15000,
      status: "PAID",
    },
  });
  await prisma.tuitionPayment.create({
    data: {
      tuitionId: tuitionPaidPayos.id,
      studentId: excusedStudent.id,
      amount: 60000,
      paidAt: addDays(TODAY, -25),
      method: "PAYOS",
      recordedBy: adminUser0.id,
      payosReference: "PAYOS-REF-DEMO-0001", // thử insert trùng giá trị này trong test để kiểm tra unique
    },
  });

  // Tuition 3: PENDING, chưa thanh toán gì
  await prisma.tuition.create({
    data: {
      studentId: s10A1[3].id,
      classId: classes["10A1"].id,
      month: 2,
      year: 2026,
      periods: 8,
      amount: 8 * 15000,
      paid: 0,
      status: "PENDING",
    },
  });

  // PaymentLink 1: PENDING — QR chưa quét
  await prisma.paymentLink.create({
    data: {
      orderCode: 100001,
      amount: 8 * 15000,
      description: "Thanh toán học phí T02/2026 - 10A1",
      status: "PENDING",
      checkoutUrl: "https://pay.payos.vn/web/100001",
      qrCode: "00020101021238570010A00000072701...demo-qr-1",
      studentId: s10A1[3].id,
      classId: classes["10A1"].id,
      month: 2,
      year: 2026,
    },
  });

  // PaymentLink 2: CANCELLED — người dùng hủy quét mã
  await prisma.paymentLink.create({
    data: {
      orderCode: 100002,
      amount: 4 * 15000,
      description: "Thanh toán học phí T03/2026 - 12A1",
      status: "CANCELLED",
      checkoutUrl: "https://pay.payos.vn/web/100002",
      studentId: s12A1[3].id,
      classId: classes["12A1"].id,
      month: 3,
      year: 2026,
    },
  });

  // PaymentLink 3: EDGE CASE quan trọng — status=PAID nhưng tuitionId=null.
  // Mô phỏng: webhook PayOS trả về SAU KHI bản ghi Tuition gốc đã bị xóa
  // (vd. admin xóa nhầm / học sinh chuyển lớp). month/year vẫn được giữ lại
  // để hệ thống fallback tự tạo lại Tuition khi cần.
  await prisma.paymentLink.create({
    data: {
      orderCode: 100003,
      amount: 8 * 15000,
      description: "Thanh toán học phí T04/2026 - 10A2 (tuition gốc đã bị xóa)",
      status: "PAID",
      checkoutUrl: "https://pay.payos.vn/web/100003",
      studentId: s10A1[4].id,
      classId: classes["10A1"].id,
      tuitionId: null, // ⚠️ cố tình null — fallback scenario
      month: 4,
      year: 2026,
      paidAt: addDays(TODAY, -2),
    },
  });

  console.log("✅ Seed hoàn tất!");
  console.log(`   - ${admins.length} admin, ${teacherProfiles.length} giáo viên, ${parentProfiles.length} phụ huynh, ${students.length} học sinh`);
  console.log(`   - ${Object.keys(subjects).length} môn học, ${Object.keys(classes).length} lớp, ${rooms.length} phòng`);
  console.log(`   - ScheduleSeries: series10A1Math(id=${series10A1Math.id}) có 3 exception + endDate=null`);
  console.log(`   - Conflict lịch cố ý: series11A1English & series11A2EnglishConflict (cùng GV, cùng thứ, giờ overlap)`);
  console.log(`   - series10A2Lit đã kết thúc, series12A1Physics đang chạy`);
}

main()
  .catch((e) => {
    console.error("❌ Seed thất bại:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
