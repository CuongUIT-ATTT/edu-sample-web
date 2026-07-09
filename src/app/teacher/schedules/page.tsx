import React from "react";
import { Calendar, Clock, MapPin, BookOpen, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TeacherSchedulesPage() {
  const session = await getSession();

  let schedulesList: {
    id: string;
    dayOfWeek: number;
    time: string;
    subjectName: string;
    subjectCode: string;
    className: string;
    room: string;
  }[] = [];
  let teacherName = session?.name || "Giáo viên";

  try {
    if (session) {
      const teacherProfile = await db.teacherProfile.findUnique({
        where: { userId: session.userId },
      });

      if (teacherProfile) {
        const schedules = await db.schedule.findMany({
          where: { teacherId: teacherProfile.id },
          include: {
            subject: true,
            class: true,
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
          className: s.class.name,
          room: s.room || "Chưa xếp phòng",
        }));
      }
    }
  } catch (error) {
    console.error("Error loading teacher schedules:", error);
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
        <h1 className="font-tagline text-2xl font-semibold text-ink">Lịch dạy của giáo viên</h1>
        <p className="font-caption text-ink-muted-80 mt-1">
          Thời khóa biểu giảng dạy — {teacherName}
        </p>
      </div>

      {schedulesList.length === 0 ? (
        <div className="bg-canvas border border-hairline rounded-lg p-16 text-center shadow-sm">
          <Calendar className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
          <p className="font-body text-ink-muted-80">Chưa được phân công lịch dạy học kỳ này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((dayNum) => {
            const daySchedules = groupedSchedules[dayNum];
            return (
              <div key={dayNum} className="bg-canvas border border-hairline rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
                <div className="px-5 py-3 border-b border-hairline bg-surface-pearl flex items-center justify-between">
                  <h3 className="font-body-strong text-sm text-ink">{getDayName(dayNum)}</h3>
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                    {daySchedules.length} Tiết
                  </span>
                </div>
                <div className="p-5 flex flex-col gap-4 flex-1">
                  {daySchedules.length === 0 ? (
                    <p className="text-xs text-ink-muted-48 font-caption italic my-auto text-center">Không có tiết dạy</p>
                  ) : (
                    daySchedules.map((s) => (
                      <div key={s.id} className="border-b border-divider-soft last:border-0 pb-3 last:pb-0 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase">
                            {s.className}
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
                            <span>Phòng: {s.room}</span>
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
