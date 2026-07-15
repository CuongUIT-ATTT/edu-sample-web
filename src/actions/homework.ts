"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface UpdateScheduleFilesInput {
  scheduleId: string;
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

    const { scheduleId, materials, homework, homeworkDueDate, homeworkQuizId } = input;

    const data: { materials?: string | null; homework?: string | null; homeworkDueDate?: Date | null; homeworkQuizId?: string | null } = {};
    if (materials !== undefined) data.materials = materials;
    if (homework !== undefined) data.homework = homework;
    if (homeworkQuizId !== undefined) data.homeworkQuizId = homeworkQuizId;
    if (homeworkDueDate !== undefined) {
      data.homeworkDueDate = homeworkDueDate ? new Date(homeworkDueDate) : null;
    }

    await db.schedule.update({
      where: { id: scheduleId },
      data,
    });

    revalidatePath("/admin/schedules");
    revalidatePath("/teacher/schedules");
    revalidatePath("/student/schedules");
    return { success: true, message: "Cập nhật tài liệu ca học thành công." };
  } catch (error) {
    console.error("Error updating schedule files:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi cập nhật tệp tin." };
  }
}

interface SubmitHomeworkInput {
  scheduleId: string;
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

    const { scheduleId, fileUrl, fileName } = input;

    if (!scheduleId || !fileUrl || !fileName) {
      return { success: false, error: "Vui lòng đính kèm tệp làm bài tập." };
    }

    const submission = await db.homeworkSubmission.upsert({
      where: {
        scheduleId_studentId: {
          scheduleId,
          studentId: studentProfile.id,
        },
      },
      create: {
        scheduleId,
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

    revalidatePath("/student/schedules");
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
        schedule: true,
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
    const dateLabel = submission.schedule.date 
      ? new Date(submission.schedule.date).toLocaleDateString("vi-VN") 
      : "";

    await db.grade.upsert({
      where: {
        id: submissionId,
      },
      create: {
        id: submissionId,
        studentId: submission.studentId,
        subjectId: submission.schedule.subjectId,
        teacherId: submission.schedule.teacherId,
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

export async function getScheduleSubmissions(scheduleId: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Bạn không có quyền xem danh sách bài nộp." };
    }

    const submissions = await db.homeworkSubmission.findMany({
      where: { scheduleId },
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

export async function getStudentSubmission(scheduleId: string) {
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

    const submission = await db.homeworkSubmission.findUnique({
      where: {
        scheduleId_studentId: {
          scheduleId,
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

export async function getClassSessionQuizSubmissions(scheduleId: string, quizId: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return { success: false, error: "Bạn không có quyền thực hiện thao tác này." };
    }

    const schedule = await db.schedule.findUnique({
      where: { id: scheduleId },
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

    if (!schedule) {
      return { success: false, error: "Không tìm thấy thông tin ca học." };
    }

    const students = schedule.class.students;
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
