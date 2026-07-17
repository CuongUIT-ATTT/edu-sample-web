import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcryptjs from "bcryptjs";

const connectionString = process.env.DATABASE_URL || "postgresql://mock_user:mock_password@localhost:5432/mock_db?schema=public";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting database seeding with expanded real-world data...");

  // Reset database (delete in order of dependencies)
  await prisma.quizSubmission.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.homeworkSubmission.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.grade.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.adminProfile.deleteMany({});
  await prisma.teacherProfile.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.parentProfile.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Database reset completed.");

  // Hash password
  const passwordHash = await bcryptjs.hash("hungcuong123", 10);

  // 1. Create Users
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@eduweb.vn",
      name: "Quản trị viên Hệ thống",
      passwordHash,
      role: "ADMIN",
    },
  });

  const teacherUser = await prisma.user.create({
    data: {
      email: "giangvien@eduweb.vn",
      name: "Thầy Nguyễn Văn Bình",
      passwordHash,
      role: "TEACHER",
    },
  });

  const teacherUser2 = await prisma.user.create({
    data: {
      email: "giangvien2@eduweb.vn",
      name: "Thầy Minh Trí",
      passwordHash,
      role: "TEACHER",
    },
  });

  const parentUser = await prisma.user.create({
    data: {
      email: "phuhuynh@eduweb.vn",
      name: "Bác Nguyễn Văn B",
      passwordHash,
      role: "PARENT",
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      email: "hocvien@eduweb.vn",
      name: "Nguyễn Văn A",
      passwordHash,
      role: "STUDENT",
    },
  });

  const studentUser2 = await prisma.user.create({
    data: {
      email: "hocvien2@eduweb.vn",
      name: "Lê Mai Anh",
      passwordHash,
      role: "STUDENT",
    },
  });

  const studentUser3 = await prisma.user.create({
    data: {
      email: "hocvien3@eduweb.vn",
      name: "Trần Tuấn Kiệt",
      passwordHash,
      role: "STUDENT",
    },
  });

  // 2. Create Profiles
  const adminProfile = await prisma.adminProfile.create({
    data: { userId: adminUser.id },
  });

  const teacherProfile = await prisma.teacherProfile.create({
    data: { userId: teacherUser.id },
  });

  const teacherProfile2 = await prisma.teacherProfile.create({
    data: { userId: teacherUser2.id },
  });

  const parentProfile = await prisma.parentProfile.create({
    data: { userId: parentUser.id },
  });

  const studentProfile = await prisma.studentProfile.create({
    data: { 
      userId: studentUser.id,
      parentId: parentProfile.id 
    },
  });

  const studentProfile2 = await prisma.studentProfile.create({
    data: { 
      userId: studentUser2.id,
      parentId: parentProfile.id 
    },
  });

  const studentProfile3 = await prisma.studentProfile.create({
    data: { 
      userId: studentUser3.id,
      parentId: parentProfile.id 
    },
  });

  // 3. Create Subjects
  const mathSubject = await prisma.subject.create({
    data: {
      name: "Toán học nâng cao",
      code: "MATH101",
      teachers: { connect: [{ id: teacherProfile.id }, { id: teacherProfile2.id }] },
    },
  });

  const physicsSubject = await prisma.subject.create({
    data: {
      name: "Vật lý lý thuyết",
      code: "PHYS101",
      teachers: { connect: { id: teacherProfile.id } },
    },
  });

  const englishSubject = await prisma.subject.create({
    data: {
      name: "Tiếng Anh học thuật",
      code: "ENGL101",
      teachers: { connect: { id: teacherProfile.id } },
    },
  });

  // 4. Create Classes
  const class10A1 = await prisma.class.create({
    data: {
      name: "10A1",
      gradeLevel: 10,
      formTeacherId: teacherProfile.id,
    },
  });

  const class11B2 = await prisma.class.create({
    data: {
      name: "11B2",
      gradeLevel: 11,
      formTeacherId: teacherProfile2.id,
    },
  });

  // Assign Students to Classes
  await prisma.studentProfile.update({
    where: { id: studentProfile.id },
    data: { classes: { connect: { id: class10A1.id } } },
  });

  await prisma.studentProfile.update({
    where: { id: studentProfile2.id },
    data: { classes: { connect: { id: class10A1.id } } },
  });

  await prisma.studentProfile.update({
    where: { id: studentProfile3.id },
    data: { classes: { connect: { id: class11B2.id } } },
  });

  // 5. Create Schedules
  const schedule1 = await prisma.schedule.create({
    data: {
      classId: class10A1.id,
      subjectId: mathSubject.id,
      teacherId: teacherProfile.id,
      dayOfWeek: 1, // Thứ Hai
      startTime: "08:00",
      endTime: "09:30",
      room: "Room 302",
      homework: "https://drive.google.com/file/d/homework-math10",
      homeworkDueDate: new Date("2026-07-20T00:00:00Z"),
    },
  });

  const schedule2 = await prisma.schedule.create({
    data: {
      classId: class10A1.id,
      subjectId: physicsSubject.id,
      teacherId: teacherProfile.id,
      dayOfWeek: 2, // Thứ Ba
      startTime: "10:00",
      endTime: "11:30",
      room: "Room 401",
    },
  });

  const schedule3 = await prisma.schedule.create({
    data: {
      classId: class11B2.id,
      subjectId: mathSubject.id,
      teacherId: teacherProfile2.id,
      dayOfWeek: 3, // Thứ Tư
      startTime: "14:00",
      endTime: "15:30",
      room: "Room 302",
    },
  });

  // 6. Create Homework Submissions
  await prisma.homeworkSubmission.create({
    data: {
      scheduleId: schedule1.id,
      studentId: studentProfile.id,
      fileUrl: "https://drive.google.com/file/d/submission-math-a",
      fileName: "Bài làm Nguyễn Văn A.pdf",
      grade: 9.0,
    },
  });

  await prisma.homeworkSubmission.create({
    data: {
      scheduleId: schedule1.id,
      studentId: studentProfile2.id,
      fileUrl: "https://drive.google.com/file/d/submission-math-b",
      fileName: "Bài làm Lê Mai Anh.pdf",
    },
  });

  // 7. Create Attendances
  await prisma.attendance.create({
    data: {
      studentId: studentProfile.id,
      date: new Date("2026-07-08T00:00:00Z"),
      status: "PRESENT",
    },
  });

  await prisma.attendance.create({
    data: {
      studentId: studentProfile.id,
      date: new Date("2026-07-07T00:00:00Z"),
      status: "PRESENT",
    },
  });

  // 8. Create Grades
  await prisma.grade.create({
    data: {
      studentId: studentProfile.id,
      subjectId: mathSubject.id,
      teacherId: teacherProfile.id,
      type: "QUIZ",
      score: 9.0,
      weight: 0.1,
      remarks: "Kiểm tra 15 phút bài lượng giác",
      date: new Date("2026-07-08T00:00:00Z"),
    },
  });

  await prisma.grade.create({
    data: {
      studentId: studentProfile.id,
      subjectId: physicsSubject.id,
      teacherId: teacherProfile.id,
      type: "ORAL",
      score: 8.0,
      weight: 0.1,
      remarks: "Kiểm tra miệng định luật Newton",
      date: new Date("2026-07-06T00:00:00Z"),
    },
  });

  // 9. Create LMS Course, Module, Lesson
  const courseMath = await prisma.course.create({
    data: {
      title: "Toán học nâng cao Lớp 10",
      description: "Chương trình chuyên sâu về Đại số và Hình học không gian chuẩn bị cho học sinh THPT.",
      thumbnail: "/images/math-10.jpg",
      level: 10,
      published: true,
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: studentProfile.id,
      courseId: courseMath.id,
    },
  });

  const moduleAlgebra = await prisma.module.create({
    data: {
      title: "Đại số chuyên đề 1: Phương trình bậc hai",
      order: 1,
      courseId: courseMath.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: "Bài 1: Phương trình bậc hai nâng cao và hệ thức Vi-ét",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      documentUrl: "/docs/viet-theorem.pdf",
      content: "Nội dung bài học lý thuyết về ứng dụng hệ thức Vi-ét trong phương trình bậc hai.",
      order: 1,
      moduleId: moduleAlgebra.id,
    },
  });

  // 10. Create Quiz & Questions
  // 10. Create Quiz & Questions
  const quizMath = await prisma.quiz.create({
    data: {
      title: "Khảo sát đầu năm môn Toán Lớp 10",
      description: "Đề khảo sát nhanh năng lực toán học chuẩn bị bước vào năm học mới.",
      duration: 15,
      passingScore: 5.0,
      subjectId: mathSubject.id,
      teacherId: teacherProfile.id,
      isPublic: true,
    },
  });

  await prisma.question.create({
    data: {
      text: "Giải phương trình x^2 - 5x + 6 = 0. Tập nghiệm x là?",
      type: "MULTIPLE_CHOICE",
      options: ["x = {2, 3}", "x = {1, 6}", "x = {-2, -3}", "x = {0, 5}"],
      correctAnswer: "0",
      score: 5.0,
      quizId: quizMath.id,
      imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80",
    },
  });

  await prisma.question.create({
    data: {
      text: "Cho hệ thức Vi-ét của phương trình x^2 + px + q = 0. Tổng hai nghiệm x1 + x2 bằng?",
      type: "MULTIPLE_CHOICE",
      options: ["p", "-p", "q", "-q"],
      correctAnswer: "1",
      score: 5.0,
      quizId: quizMath.id,
    },
  });

  // 11. Create Quiz Submissions (for score averaging and counts)
  await prisma.quizSubmission.create({
    data: {
      quizId: quizMath.id,
      studentId: studentProfile.id,
      score: 10.0,
      answers: JSON.stringify({}),
      submittedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
    },
  });

  await prisma.quizSubmission.create({
    data: {
      quizId: quizMath.id,
      studentId: studentProfile2.id,
      score: 5.0,
      answers: JSON.stringify({}),
      submittedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
    },
  });

  await prisma.quizSubmission.create({
    data: {
      quizId: quizMath.id,
      guestName: "Trần Minh Hoàng",
      score: 7.5,
      answers: JSON.stringify({}),
      submittedAt: new Date(Date.now() - 2 * 3600 * 1000), // 2 hours ago
    },
  });

  // 12. Seed 10+ extra students and submissions to make stats rich and real
  const studentNames = [
    "Phạm Minh Hoàng", "Đỗ Thu Trang", "Vũ Quốc Bảo", "Hoàng Thùy Chi",
    "Ngô Đức Anh", "Bùi Thị Mai", "Dương Tấn Đạt", "Lý Thanh Thảo",
    "Phan Cao Sơn", "Tạ Minh Hằng"
  ];

  for (let i = 0; i < studentNames.length; i++) {
    const email = `hocvien_extra${i + 1}@eduweb.vn`;
    const name = studentNames[i];
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "STUDENT",
      },
    });

    const studentProf = await prisma.studentProfile.create({
      data: {
        userId: user.id,
        parentId: parentProfile.id
      },
    });

    // Create a random quiz submission
    const score = parseFloat((5 + Math.random() * 5).toFixed(1)); // random score between 5.0 and 10.0
    await prisma.quizSubmission.create({
      data: {
        quizId: quizMath.id,
        studentId: studentProf.id,
        score,
        answers: JSON.stringify({}),
        submittedAt: new Date(Date.now() - (i + 1) * 3600 * 1000), // i hours ago
      },
    });
  }

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
