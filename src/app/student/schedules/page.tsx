import React from "react";
import { Calendar, Clock, MapPin, User, BookOpen } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudentSchedulesPage() {
  const session = await getSession();

  let schedulesList: {
    id: string;
    dayOfWeek: number;
    time: string;
    subjectName: string;
    subjectCode: string;
    teacherName: string;
    room: string;
  }[] = [];
  let studentName = session?.name || "Học sinh";
  let className = "Lớp học";

  try {
    if (session) {
      const studentProfile = await db.studentProfile.findUnique({
        where: { userId: session.userId },
        include: {
          class: true,
        },
      });

      if (studentProfile?.class) {
        className = studentProfile.class.name;

        const schedules = await db.schedule.findMany({
          where: { classId: studentProfile.class.id },
          include: {
            subject: true,
            teacher: {
              include: { user: true },
            },
          },
          orderBy: [
            { dayOfWeek: "asc" },
            { startTime: "asc" },
          ],
        });

        schedulesList = schedules.map((s) => ({
          id: s.id,
          dayOfWeek: s.dayOfWeek,
          time: `${s.startTime} - ${s.endTime}`,
          subjectName: s.subject.name,
          subjectCode: s.subject.code,
          teacherName: s.teacher.user.name,
          room: s.room || "Chưa xếp phòng",
        }));
      }
    }
  } catch (error) {
    console.error("Error loading student schedules:", error);
  }

  const getDayName = (day: number) => {
    const days: Record<number, string> = {
      1: "Thứ Hai",
      2: "Thứ Ba",
      3: "Thứ Tư",
      4: "Thứ Năm",
      5: "Thứ Sáu",
      6: "Thứ Bảy",
      7: "Chủ Nhật",
    };
    return days[day] || `Thứ ${day}`;
  };

  // Group schedules by day of week
  const groupedSchedules: Record<number, typeof schedulesList> = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: []
  };

  schedulesList.forEach((s) => {
    if (groupedSchedules[s.dayOfWeek]) {
      groupedSchedules[s.dayOfWeek].push(s);
    }
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">Thời khóa biểu lớp học</h1>
        <p className="font-caption text-ink-muted-80 mt-1">
          Lịch học của học sinh: <span className="font-semibold text-ink">{studentName}</span> — Lớp: <span className="font-semibold text-primary">{className}</span>
        </p>
      </div>

      {schedulesList.length === 0 ? (
        <div className="bg-canvas border border-hairline rounded-lg p-16 text-center shadow-sm">
          <Calendar className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
          <p className="font-body text-ink-muted-80">Chưa xếp thời khóa biểu cho lớp học này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((dayNum) => {
            const daySchedules = groupedSchedules[dayNum];
            return (
              <div key={dayNum} className="bg-canvas border border-hairline rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
                <div className="px-5 py-3 border-b border-hairline bg-surface-pearl flex items-center justify-between">
                  <h3 className="font-body-strong text-sm text-ink">{getDayName(dayNum)}</h3>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                    {daySchedules.length} Tiết
                  </span>
                </div>
                <div className="p-5 flex flex-col gap-4 flex-1">
                  {daySchedules.length === 0 ? (
                    <p className="text-xs text-ink-muted-48 font-caption italic my-auto text-center">Không có tiết học</p>
                  ) : (
                    daySchedules.map((s) => (
                      <div key={s.id} className="border-b border-divider-soft last:border-0 pb-3 last:pb-0 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold bg-primary-muted-12 text-primary px-1.5 py-0.5 rounded uppercase">
                            {s.subjectCode}
                          </span>
                          <span className="text-xs font-body-strong text-ink line-clamp-1">{s.subjectName}</span>
                        </div>
                        <div className="flex flex-col gap-1 text-[11px] text-ink-muted-80 font-caption">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-ink-muted-48" />
                            <span>{s.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-ink-muted-48" />
                            <span>{s.room}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-ink-muted-48">
                            <User className="h-3 w-3 text-ink-muted-48" />
                            <span>GV: {s.teacherName}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
