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

function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(":").map(Number);
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return -1;
  return parts[0] * 60 + parts[1];
}

export async function createSchedule(input: CreateScheduleInput) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Bạn không có quyền thực hiện thao tác này." };
    }

    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, ignoreWarning } = input;

    if (!classId || !subjectId || !teacherId || isNaN(dayOfWeek) || !startTime || !endTime || !room) {
      return { success: false, error: "Vui lòng nhập đầy đủ thông tin lịch học, bao gồm cả phòng học." };
    }

    // 1. Validate room exists in the admin-defined Room table
    const targetRoom = await db.room.findFirst({
      where: { name: { equals: room.trim(), mode: "insensitive" } }
    });
    if (!targetRoom) {
      return { success: false, error: `Phòng học "${room}" không tồn tại. Vui lòng chọn một phòng học hợp lệ do Admin quản lý.` };
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

    // 3. Query same-day schedules to check overlaps
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
        subject: true,
        teacher: {
          include: { user: true }
        }
      }
    });

    const isTeacher = session.role === "TEACHER";
    
    // Find current teacher profile id if teacher is adding it
    let currentTeacherProfileId = "";
    if (isTeacher) {
      const teacherProfile = await db.teacherProfile.findUnique({
        where: { userId: session.userId }
      });
      currentTeacherProfileId = teacherProfile?.id || "";
    }

    for (const existing of sameDaySchedules) {
      const existingStart = parseTimeToMinutes(existing.startTime);
      const existingEnd = parseTimeToMinutes(existing.endTime);
      
      // Check time overlap
      const isOverlapping = (startMin < existingEnd) && (endMin > existingStart);
      if (isOverlapping) {
        // Build conflict details with privacy protection for teachers
        const formatConflictMsg = (conflictType: string) => {
          // If admin, or the teacher owns the conflicting schedule, show details
          if (!isTeacher || existing.teacherId === currentTeacherProfileId) {
            return `TRÙNG LỊCH HỌC (${conflictType}): Lớp ${existing.class.name} (${existing.startTime} - ${existing.endTime}, môn ${existing.subject.name}, GV: ${existing.teacher.user.name}) đang diễn ra tại Phòng ${existing.room}.`;
          } else {
            // Hide sensitive details for other teachers' schedules
            return `TRÙNG LỊCH HỌC (${conflictType}): Đang có ca học khác bận trong khoảng thời gian (${existing.startTime} - ${existing.endTime}) tại Phòng ${existing.room}.`;
          }
        };

        // A. Same room overlap
        if (room.trim().toLowerCase() === existing.room?.toLowerCase()) {
          return { success: false, error: formatConflictMsg("Trùng phòng học") };
        }

        // B. Same teacher overlap
        if (teacherId === existing.teacherId) {
          return { success: false, error: formatConflictMsg("Trùng lịch giảng viên") };
        }

        // C. Same class overlap
        if (classId === existing.classId) {
          return { success: false, error: formatConflictMsg("Trùng lịch lớp") };
        }

        // D. Shared students overlap
        if (!ignoreWarning) {
          const class1Students = await db.studentProfile.findMany({
            where: { classId },
            include: { user: true }
          });
          const class2Students = existing.class.students;

          const shared = class1Students.filter(s1 => 
            class2Students.some(s2 => s2.userId === s1.userId)
          );

          if (shared.length > 0) {
            if (isTeacher && existing.teacherId !== currentTeacherProfileId) {
              return {
                success: false,
                isWarning: true,
                error: `CẢNH BÁO TRÙNG LỊCH HỌC SINH: Lớp học có học viên bận trong khoảng thời gian (${existing.startTime} - ${existing.endTime}) học lớp khác. Bạn có muốn tiếp tục tạo?`
              };
            } else {
              const studentNames = shared.map(s => s.user.name).slice(0, 3).join(", ") + 
                (shared.length > 3 ? ` và ${shared.length - 3} học viên khác` : "");
              
              return {
                success: false,
                isWarning: true,
                error: `CẢNH BÁO TRÙNG LỊCH HỌC SINH: Trùng giờ với lớp ${existing.class.name} (${existing.startTime} - ${existing.endTime}, môn ${existing.subject.name}). Học viên trùng: ${studentNames}. Bạn có muốn tiếp tục tạo?`
              };
            }
          }
        }
      }
    }

    // 4. Create the schedule
    await db.schedule.create({
      data: {
        classId,
        subjectId,
        teacherId,
        dayOfWeek,
        startTime,
        endTime,
        room: room.trim(),
      },
    });

    revalidatePath("/admin/schedules");
    revalidatePath("/teacher/schedules");
    return { success: true, message: "Sắp xếp lịch học thành công." };
  } catch (error) {
    console.error("Error creating schedule:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi xếp lịch." };
  }
}

export async function deleteSchedule(scheduleId: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Bạn không có quyền thực hiện thao tác này." };
    }

    await db.schedule.delete({
      where: { id: scheduleId },
    });

    revalidatePath("/admin/schedules");
    revalidatePath("/teacher/schedules");
    return { success: true, message: "Xoá ca lịch học thành công." };
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi xoá ca học." };
  }
}
