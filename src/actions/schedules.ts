/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

interface CreateScheduleInput {
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  ignoreWarning?: boolean;
  
  startDate: string;  // Format YYYY-MM-DD
  endDate?: string;   // Format YYYY-MM-DD
  recurrence: "NONE" | "WEEKLY";
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

    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, ignoreWarning, startDate, endDate, recurrence } = input;

    if (!classId || !subjectId || !teacherId || isNaN(dayOfWeek) || !startTime || !endTime || !room || !startDate) {
      return { success: false, error: "Vui lòng nhập đầy đủ thông tin lịch học, bao gồm cả phòng học và ngày bắt đầu." };
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

    // 3. Build array of specific dates to create
    const datesToCreate: Date[] = [];
    let recurrenceGroupId: string | null = null;

    const start = new Date(startDate);
    if (recurrence === "WEEKLY" && endDate) {
      recurrenceGroupId = crypto.randomUUID();
      const end = new Date(endDate);
      const targetJsDay = dayOfWeek === 7 ? 0 : dayOfWeek; // Mon=1, ..., Sun=7 -> JS getDay(): 0=Sun, 1=Mon...
      
      const current = new Date(start);
      while (current <= end) {
        if (current.getDay() === targetJsDay) {
          datesToCreate.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
      }
      
      if (datesToCreate.length === 0) {
        return { success: false, error: "Không tìm thấy ngày nào khớp với thứ đã chọn trong khoảng thời gian đã cho." };
      }
    } else {
      datesToCreate.push(start);
    }

    // 4. Query same-day schedules to check overlaps
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
      const isTimeOverlapping = (startMin < existingEnd) && (endMin > existingStart);
      if (!isTimeOverlapping) continue;

      // Check date conflict: overlaps if existing has no date (legacy) OR shares at least one date in our new list
      const dateOverlap = !existing.date || datesToCreate.some(d => {
        const existingDateStr = existing.date ? new Date(existing.date).toISOString().split("T")[0] : "";
        const curDateStr = d.toISOString().split("T")[0];
        return existingDateStr === curDateStr;
      });

      if (!dateOverlap) continue;

      // Build conflict details with privacy protection for teachers
      const formatConflictMsg = (conflictType: string) => {
        const existingDateLabel = existing.date ? ` ngày ${new Date(existing.date).toLocaleDateString("vi-VN")}` : " (lặp lại)";
        // If admin, or the teacher owns the conflicting schedule, show details
        if (!isTeacher || existing.teacherId === currentTeacherProfileId) {
          return `TRÙNG LỊCH HỌC (${conflictType}): Lớp ${existing.class.name} (${existing.startTime} - ${existing.endTime}, môn ${existing.subject.name}, GV: ${existing.teacher.user.name}) đang diễn ra tại Phòng ${existing.room}${existingDateLabel}.`;
        } else {
          // Hide sensitive details for other teachers' schedules
          return `TRÙNG LỊCH HỌC (${conflictType}): Đang có ca học khác bận trong khoảng thời gian (${existing.startTime} - ${existing.endTime}) tại Phòng ${existing.room}${existingDateLabel}.`;
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
          where: {
            classes: {
              some: { id: classId }
            }
          },
          include: { user: true }
        });
        const class2Students = existing.class.students;

        const shared = class1Students.filter(s1 => 
          class2Students.some(s2 => s2.userId === s1.userId)
        );

        if (shared.length > 0) {
          const dateLabel = existing.date ? ` ngày ${new Date(existing.date).toLocaleDateString("vi-VN")}` : "";
          if (isTeacher && existing.teacherId !== currentTeacherProfileId) {
            return {
              success: false,
              isWarning: true,
              error: `CẢNH BÁO TRÙNG LỊCH HỌC SINH: Lớp học có học viên bận trong khoảng thời gian (${existing.startTime} - ${existing.endTime})${dateLabel} học lớp khác. Bạn có muốn tiếp tục tạo?`
            };
          } else {
            const studentNames = shared.map(s => s.user.name).slice(0, 3).join(", ") + 
              (shared.length > 3 ? ` và ${shared.length - 3} học viên khác` : "");
            
            return {
              success: false,
              isWarning: true,
              error: `CẢNH BÁO TRÙNG LỊCH HỌC SINH: Trùng giờ với lớp ${existing.class.name} (${existing.startTime} - ${existing.endTime}${dateLabel}, môn ${existing.subject.name}). Học viên trùng: ${studentNames}. Bạn có muốn tiếp tục tạo?`
            };
          }
        }
      }
    }

    // 5. Create all occurrences atomically in a transaction
    await db.$transaction(
      datesToCreate.map(d => {
        return db.schedule.create({
          data: {
            classId,
            subjectId,
            teacherId,
            dayOfWeek,
            startTime,
            endTime,
            room: room.trim(),
            date: d,
            recurrenceGroupId,
          }
        });
      })
    );

    revalidatePath("/admin/schedules");
    revalidatePath("/teacher/schedules");
    return { success: true, message: `Sắp xếp ${datesToCreate.length} ca lịch học thành công.` };
  } catch (error) {
    console.error("Error creating schedule:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi xếp lịch." };
  }
}

export async function deleteSchedule(
  scheduleId: string,
  deleteMode: "ONLY_THIS" | "ALL_FUTURE" = "ONLY_THIS"
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Bạn không có quyền thực hiện thao tác này." };
    }

    const schedule = await db.schedule.findUnique({
      where: { id: scheduleId }
    });

    if (!schedule) {
      return { success: false, error: "Không tìm thấy ca lịch học." };
    }

    // Guard: prevent deletion if student submissions exist for target schedules
    const checkSubmissionsExist = async (whereCondition: any) => {
      const count = await db.homeworkSubmission.count({
        where: {
          schedule: whereCondition
        }
      });
      return count > 0;
    };

    if (deleteMode === "ALL_FUTURE" && schedule.recurrenceGroupId && schedule.date) {
      const hasSubmissions = await checkSubmissionsExist({
        recurrenceGroupId: schedule.recurrenceGroupId,
        date: { gte: schedule.date }
      });
      if (hasSubmissions) {
        return { 
          success: false, 
          error: "Không thể xóa: Học viên đã nộp bài tập về nhà trong chuỗi ca học lặp lại tương lai này. Vui lòng chấm điểm hoặc hoàn thành các bài tập trước." 
        };
      }

      await db.schedule.deleteMany({
        where: {
          recurrenceGroupId: schedule.recurrenceGroupId,
          date: { gte: schedule.date }
        }
      });
    } else {
      const hasSubmissions = await checkSubmissionsExist({ id: scheduleId });
      if (hasSubmissions) {
        return { 
          success: false, 
          error: "Không thể xóa: Học viên đã nộp bài tập cho ca học này. Vui lòng chấm điểm bài nộp trước." 
        };
      }

      await db.schedule.delete({
        where: { id: scheduleId }
      });
    }

    revalidatePath("/admin/schedules");
    revalidatePath("/teacher/schedules");
    return { success: true, message: "Xoá ca lịch học thành công." };
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi xoá ca học." };
  }
}

interface UpdateScheduleInput {
  scheduleId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  date?: string; // YYYY-MM-DD
  updateMode: "ONLY_THIS" | "ALL_FUTURE";
  ignoreWarning?: boolean;
}

export async function updateSchedule(input: UpdateScheduleInput) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Bạn không có quyền thực hiện thao tác này." };
    }

    const { scheduleId, classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, date, updateMode, ignoreWarning } = input;

    if (!scheduleId || !classId || !subjectId || !teacherId || isNaN(dayOfWeek) || !startTime || !endTime || !room || !date) {
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

    const targetSchedule = await db.schedule.findUnique({
      where: { id: scheduleId }
    });
    if (!targetSchedule) {
      return { success: false, error: "Không tìm thấy ca lịch học cần cập nhật." };
    }

    // Determine target schedules to update
    const schedulesToUpdate: any[] = [];
    const dateDiffs: number[] = []; // differences in time to shift each date

    const newStartDate = new Date(date);
    if (updateMode === "ALL_FUTURE" && targetSchedule.recurrenceGroupId && targetSchedule.date) {
      const futures = await db.schedule.findMany({
        where: {
          recurrenceGroupId: targetSchedule.recurrenceGroupId,
          date: { gte: targetSchedule.date }
        },
        orderBy: { date: "asc" }
      });
      
      const oldStartDate = new Date(targetSchedule.date);
      const diffTime = newStartDate.getTime() - oldStartDate.getTime();

      futures.forEach((f) => {
        schedulesToUpdate.push(f);
        if (f.date) {
          const oldDate = new Date(f.date);
          const newDate = new Date(oldDate.getTime() + diffTime);
          dateDiffs.push(newDate.getTime());
        } else {
          dateDiffs.push(newStartDate.getTime());
        }
      });
    } else {
      schedulesToUpdate.push(targetSchedule);
      dateDiffs.push(newStartDate.getTime());
    }

    // Check overlap for each updated schedule
    const idsToExclude = schedulesToUpdate.map((s) => s.id);
    const isTeacher = session.role === "TEACHER";
    let currentTeacherProfileId = "";
    if (isTeacher) {
      const teacherProfile = await db.teacherProfile.findUnique({
        where: { userId: session.userId }
      });
      currentTeacherProfileId = teacherProfile?.id || "";
    }

    for (let i = 0; i < schedulesToUpdate.length; i++) {
      const targetDate = new Date(dateDiffs[i]);
      const targetDateStr = targetDate.toISOString().split("T")[0];

      // Query database for conflicting schedules on the same dayOfWeek, excluding the schedules being updated
      const conflicts = await db.schedule.findMany({
        where: {
          dayOfWeek,
          id: { notIn: idsToExclude }
        },
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

      for (const existing of conflicts) {
        const existingStart = parseTimeToMinutes(existing.startTime);
        const existingEnd = parseTimeToMinutes(existing.endTime);
        const isTimeOverlapping = (startMin < existingEnd) && (endMin > existingStart);
        if (!isTimeOverlapping) continue;

        const dateOverlap = !existing.date || (new Date(existing.date).toISOString().split("T")[0] === targetDateStr);
        if (!dateOverlap) continue;

        // Overlap detected!
        const formatConflictMsg = (conflictType: string) => {
          const existingDateLabel = existing.date ? ` ngày ${new Date(existing.date).toLocaleDateString("vi-VN")}` : " (lặp lại)";
          if (!isTeacher || existing.teacherId === currentTeacherProfileId) {
            return `TRÙNG LỊCH HỌC (${conflictType}): Lớp ${existing.class.name} (${existing.startTime} - ${existing.endTime}, môn ${existing.subject.name}, GV: ${existing.teacher.user.name}) đang diễn ra tại Phòng ${existing.room}${existingDateLabel}.`;
          } else {
            return `TRÙNG LỊCH HỌC (${conflictType}): Đang có ca học khác bận trong khoảng thời gian (${existing.startTime} - ${existing.endTime}) tại Phòng ${existing.room}${existingDateLabel}.`;
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
            where: {
              classes: {
                some: { id: classId }
              }
            },
            include: { user: true }
          });
          const class2Students = existing.class.students;

          const shared = class1Students.filter(s1 => 
            class2Students.some(s2 => s2.userId === s1.userId)
          );

          if (shared.length > 0) {
            const dateLabel = existing.date ? ` ngày ${new Date(existing.date).toLocaleDateString("vi-VN")}` : "";
            if (isTeacher && existing.teacherId !== currentTeacherProfileId) {
              return {
                success: false,
                isWarning: true,
                error: `CẢNH BÁO TRÙNG LỊCH HỌC SINH: Lớp học có học viên bận trong khoảng thời gian (${existing.startTime} - ${existing.endTime})${dateLabel} học lớp khác. Bạn có muốn tiếp tục cập nhật?`
              };
            } else {
              const studentNames = shared.map(s => s.user.name).slice(0, 3).join(", ") + 
                (shared.length > 3 ? ` và ${shared.length - 3} học viên khác` : "");
              
              return {
                success: false,
                isWarning: true,
                error: `CẢNH BÁO TRÙNG LỊCH HỌC SINH: Trùng giờ với lớp ${existing.class.name} (${existing.startTime} - ${existing.endTime}${dateLabel}, môn ${existing.subject.name}). Học viên trùng: ${studentNames}. Bạn có muốn tiếp tục cập nhật?`
              };
            }
          }
        }
      }
    }

    // Run updates atomically in transaction
    await db.$transaction(
      schedulesToUpdate.map((s, idx) => {
        return db.schedule.update({
          where: { id: s.id },
          data: {
            classId,
            subjectId,
            teacherId,
            dayOfWeek,
            startTime,
            endTime,
            room: room.trim(),
            date: new Date(dateDiffs[idx]),
          }
        });
      })
    );

    revalidatePath("/admin/schedules");
    revalidatePath("/teacher/schedules");
    return { success: true, message: `Cập nhật ${schedulesToUpdate.length} ca lịch học thành công.` };
  } catch (error) {
    console.error("Error updating schedule:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi cập nhật lịch." };
  }
}
