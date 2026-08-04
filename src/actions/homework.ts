"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { normalizeDateUtc, dateToUtcStr } from "@/lib/schedule-expand";

interface UpdateScheduleFilesInput {
  seriesId: string;
  instanceDate: string; // YYYY-MM-DD
  materials?: string | null;
  homework?: string | null;
  homeworkDueDate?: string | null;
  homeworkQuizId?: string | null;
}

export async function updateScheduleFiles(input: UpdateScheduleFilesInput) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Bạn không có quyền thực hiện thao tác này." };
    }

    const { seriesId, instanceDate, materials, homework, homeworkDueDate, homeworkQuizId } = input;

    if (!seriesId || !instanceDate) {
      return { success: false, error: "Thiếu thông tin buổi học." };
    }

    const targetDate = normalizeDateUtc(instanceDate);

    // Tài liệu/BTVN gắn với 1 buổi cụ thể → tạo exception MODIFIED (chỉ override field liên quan)
    const data: { materials?: string | null; homework?: string | null; homeworkDueDate?: Date | null; homeworkQuizId?: string | null } = {};
    if (materials !== undefined) data.materials = materials;
    if (homework !== undefined) data.homework = homework;
    if (homeworkQuizId !== undefined) data.homeworkQuizId = homeworkQuizId;
    if (homeworkDueDate !== undefined) {
      data.homeworkDueDate = homeworkDueDate ? new Date(homeworkDueDate) : null;
    }

    // Upsert exception MODIFIED, giữ các field khác (class/subject/teacher/room/time) không đổi
    const existing = await db.scheduleException.findUnique({
      where: { seriesId_originalDate: { seriesId, originalDate: targetDate } },
    });

    if (existing && existing.status === "CANCELLED") {
      // Không ghi tài liệu vào buổi đã hủy
      return { success: false, error: "Buổi học này đã bị hủy, không thể cập nhật tài liệu." };
    }

    await db.scheduleException.upsert({
      where: { seriesId_originalDate: { seriesId, originalDate: targetDate } },
      create: {
        seriesId,
        originalDate: targetDate,
        status: "MODIFIED",
        ...data,
      },
      update: data,
    });

    revalidatePath("/admin/calendar");
    revalidatePath("/teacher/calendar");
    revalidatePath("/student/calendar");
    return { success: true, message: "Cập nhật tài liệu ca học thành công." };
  } catch (error) {
    console.error("Error updating schedule files:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi cập nhật tệp tin." };
  }
}

interface SubmitHomeworkInput {
  seriesId: string;
  instanceDate: string; // YYYY-MM-DD
  fileUrl: string;
  fileName: string;
}

export async function submitHomework(input: SubmitHomeworkInput) {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return { success: false, error: "Chỉ học viên mới được quyền nộp bài tập về nhà." };
    }

    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!studentProfile) {
      return { success: false, error: "Hồ sơ học viên của bạn không tồn tại." };
    }

    const { seriesId, instanceDate, fileUrl, fileName } = input;

    if (!seriesId || !instanceDate || !fileUrl || !fileName) {
      return { success: false, error: "Vui lòng đính kèm tệp làm bài tập." };
    }

    const targetDate = normalizeDateUtc(instanceDate);

    const submission = await db.homeworkSubmission.upsert({
      where: {
        seriesId_instanceDate_studentId: {
          seriesId,
          instanceDate: targetDate,
          studentId: studentProfile.id,
        },
      },
      create: {
        seriesId,
        instanceDate: targetDate,
        studentId: studentProfile.id,
        fileUrl,
        fileName,
      },
      update: {
        fileUrl,
        fileName,
        submittedAt: new Date(),
      },
    });

    revalidatePath("/student/calendar");
    return { success: true, message: "Nộp bài tập về nhà thành công!", data: submission };
  } catch (error) {
    console.error("Error submitting homework:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi nộp bài." };
  }
}

interface GradeHomeworkInput {
  submissionId: string;
  grade: number;
  feedback?: string | null;
}

export async function gradeHomework(input: GradeHomeworkInput) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Bạn không có quyền chấm điểm." };
    }

    const { submissionId, grade, feedback } = input;

    if (isNaN(grade) || grade < 0 || grade > 10) {
      return { success: false, error: "Điểm số không hợp lệ. Vui lòng chấm điểm từ 0 đến 10." };
    }

    const submission = await db.homeworkSubmission.findUnique({
      where: { id: submissionId },
      include: {
        series: true,
        student: true,
      },
    });

    if (!submission) {
      return { success: false, error: "Không tìm thấy bài nộp bài tập của học sinh." };
    }

    // 1. Update homework submission status
    const updatedSubmission = await db.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        grade,
        feedback,
      },
    });

    // 2. Sync with Grade table to show in report sheets
    const dateLabel = dateToUtcStr(submission.instanceDate);

    await db.grade.upsert({
      where: {
        id: submissionId,
      },
      create: {
        id: submissionId,
        studentId: submission.studentId,
        subjectId: submission.series.subjectId,
        teacherId: submission.series.teacherId,
        homeworkSubmissionId: submissionId,
        type: "QUIZ", // Map to existing type enum or column
        score: grade,
        weight: 0.1, // Homework weight
        remarks: `Điểm bài tập ca ngày ${dateLabel}`,
      },
      update: {
        score: grade,
        remarks: `Điểm bài tập ca ngày ${dateLabel}`,
      },
    });

    revalidatePath("/teacher/grades");
    revalidatePath("/student/grades");
    revalidatePath("/parent/grades");
    return { success: true, message: "Chấm điểm bài tập thành công!", data: updatedSubmission };
  } catch (error) {
    console.error("Error grading homework:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi chấm điểm." };
  }
}

export async function getScheduleSubmissions(seriesId: string, instanceDate: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Bạn không có quyền xem danh sách bài nộp." };
    }

    const targetDate = normalizeDateUtc(instanceDate);

    const submissions = await db.homeworkSubmission.findMany({
      where: { seriesId, instanceDate: targetDate },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return { success: true, data: submissions };
  } catch (error) {
    console.error("Error getting submissions:", error);
    return { success: false, error: "Lỗi hệ thống khi tải danh sách bài nộp." };
  }
}

export async function getStudentSubmission(seriesId: string, instanceDate: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return { success: false, error: "Bạn không phải là học sinh." };
    }

    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!studentProfile) {
      return { success: false, error: "Không tìm thấy hồ sơ học sinh." };
    }

    const targetDate = normalizeDateUtc(instanceDate);

    const submission = await db.homeworkSubmission.findUnique({
      where: {
        seriesId_instanceDate_studentId: {
          seriesId,
          instanceDate: targetDate,
          studentId: studentProfile.id,
        },
      },
    });

    return { success: true, data: submission };
  } catch (error) {
    console.error("Error getting student submission:", error);
    return { success: false, error: "Lỗi hệ thống khi tải bài nộp học sinh." };
  }
}

/**
 * Get all students in the class for a schedule instance, with their submission status.
 */
export async function getHomeworkSubmissionsWithStudents(seriesId: string, instanceDate: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Bạn không có quyền thực hiện thao tác này." };
    }

    const targetDate = normalizeDateUtc(instanceDate);

    const series = await db.scheduleSeries.findUnique({
      where: { id: seriesId },
      include: {
        class: {
          include: {
            students: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!series) {
      return { success: false, error: "Không tìm thấy buổi học." };
    }

    const allStudents = series.class.students;

    const submissions = await db.homeworkSubmission.findMany({
      where: { seriesId, instanceDate: targetDate },
    });

    const result = allStudents.map((student) => {
      const sub = submissions.find((s) => s.studentId === student.id);
      return {
        studentId: student.id,
        studentName: student.user.name,
        studentEmail: student.user.email,
        submitted: sub != null,
        fileUrl: sub?.fileUrl ?? null,
        fileName: sub?.fileName ?? null,
        submittedAt: sub?.submittedAt ?? null,
        grade: sub?.grade ?? null,
        feedback: sub?.feedback ?? null,
      };
    });

    result.sort((a, b) => {
      if (a.submitted !== b.submitted) return a.submitted ? -1 : 1;
      return a.studentName.localeCompare(b.studentName);
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting homework submissions:", error);
    return { success: false, error: "Lỗi hệ thống khi tải danh sách." };
  }
}

export async function getClassSessionQuizSubmissions(seriesId: string, quizId: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return { success: false, error: "Bạn không có quyền thực hiện thao tác này." };
    }

    const series = await db.scheduleSeries.findUnique({
      where: { id: seriesId },
      include: {
        class: {
          include: {
            students: {
              include: {
                user: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    if (!series) {
      return { success: false, error: "Không tìm thấy thông tin buổi học." };
    }

    const students = series.class.students;
    const studentIds = students.map(s => s.id);

    // Fetch quiz submissions for this quiz by students in this class
    const submissions = await db.quizSubmission.findMany({
      where: {
        quizId,
        studentId: { in: studentIds }
      },
      orderBy: { submittedAt: "desc" }
    });

    // Match students with their submissions
    const results = students.map(st => {
      const sub = submissions.find(s => s.studentId === st.id);
      return {
        studentId: st.id,
        studentName: st.user.name,
        submitted: !!sub,
        score: sub ? sub.score : null,
        submittedAt: sub ? sub.submittedAt.toISOString() : null
      };
    });

    return { success: true, data: results };
  } catch (error) {
    console.error("Error fetching class session quiz submissions:", error);
    return { success: false, error: "Lỗi hệ thống khi tải điểm trắc nghiệm." };
  }
}
