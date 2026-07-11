"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface CreateScheduleInput {
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  ignoreWarning?: boolean; // In case we want to let them force create
}

export async function createSchedule(input: CreateScheduleInput) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Chỉ Quản trị viên mới được tạo lịch học." };
    }

    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, ignoreWarning } = input;

    if (!classId || !subjectId || !teacherId || isNaN(dayOfWeek) || !startTime || !endTime) {
      return { success: false, error: "Vui lòng nhập đầy đủ thông tin lịch học." };
    }

    // 1. Check schedule time overlap & shared students on the same dayOfWeek
    if (!ignoreWarning) {
      const sameDaySchedules = await db.schedule.findMany({
        where: { dayOfWeek },
        include: {
          class: {
            include: {
              students: {
                include: { user: true }
              }
            }
          },
          subject: true
        }
      });

      for (const existing of sameDaySchedules) {
        // Overlap check: (newStart < existingEnd) && (newEnd > existingStart)
        const isOverlapping = (startTime < existing.endTime) && (endTime > existing.startTime);
        if (isOverlapping) {
          // Check if classes share at least one student
          const class1Students = await db.studentProfile.findMany({
            where: { classId },
            include: { user: true }
          });
          const class2Students = existing.class.students;

          const sharedStudents = class1Students.filter(s1 => 
            class2Students.some(s2 => s2.userId === s1.userId)
          );

          if (sharedStudents.length > 0) {
            const studentNames = sharedStudents.map(s => s.user.name).slice(0, 3).join(", ") + 
              (sharedStudents.length > 3 ? ` và ${sharedStudents.length - 3} học viên khác` : "");
            
            return {
              success: false,
              isWarning: true,
              error: `TRÙNG LỊCH HỌC: Thời gian (${startTime} - ${endTime}) trùng với ca của lớp ${existing.class.name} (${existing.startTime} - ${existing.endTime}, môn ${existing.subject.name}). Hai lớp có chung học viên: ${studentNames}. Bạn có muốn tiếp tục tạo không?`
            };
          }
        }
      }
    }

    // 2. Create the schedule in DB
    await db.schedule.create({
      data: {
        classId,
        subjectId,
        teacherId,
        dayOfWeek,
        startTime,
        endTime,
        room: room || null,
      },
    });

    revalidatePath("/admin/schedules");
    return { success: true, message: "Tạo ca lịch học thành công." };
  } catch (error) {
    console.error("Error creating schedule:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi tạo lịch học." };
  }
}

export async function deleteSchedule(scheduleId: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Chỉ Quản trị viên mới được xoá lịch học." };
    }

    await db.schedule.delete({
      where: { id: scheduleId },
    });

    revalidatePath("/admin/schedules");
    return { success: true, message: "Xoá ca lịch học thành công." };
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi xoá lịch học." };
  }
}
