import React from "react";
import { Calendar, Clock, Download, ExternalLink, CheckCircle } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudentSchedulesPage() {
  const session = await getSession();

  let schedulesList: {
    id: string;
    dayOfWeek: number;
    time: string;
    courseName: string;
    topicName: string;
    platform: string;
    documentUrl: string;
    homeworkUrl: string;
  }[] = [];
  let studentName = session?.name || "Học viên";
  let className = "LIVEVIP 2K12";

  try {
    if (session) {
      const studentProfile = await db.studentProfile.findUnique({
        where: { userId: session.userId },
        include: { class: true },
      });

      if (studentProfile?.class) {
        className = studentProfile.class.name;

        const schedules = await db.schedule.findMany({
          where: { classId: studentProfile.classId || "" },
          include: {
            subject: true,
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
          courseName: className,
          topicName: s.subject.name,
          platform: s.room || "Facebook Group Live",
          documentUrl: "/docs/lesson-lecture.pdf",
          homeworkUrl: "/student/quizzes",
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
        <h1 className="font-tagline text-2xl font-semibold text-ink">Lịch học Livestream tuần</h1>
        <p className="font-caption text-ink-muted-80 mt-1">
          Lộ trình luyện thi của học viên: <span className="font-semibold text-ink">{studentName}</span> — Lớp VIP: <span className="font-semibold text-primary">{className}</span>
        </p>
      </div>

      {schedulesList.length === 0 ? (
        <div className="bg-canvas border border-hairline rounded-lg p-16 text-center shadow-sm">
          <Calendar className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
          <p className="font-body text-ink-muted-80">Chưa xếp lịch học livestream cho khóa học này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map((dayNum) => {
            const daySchedules = groupedSchedules[dayNum];
            return (
              <div key={dayNum} className="bg-canvas border border-hairline rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-hairline bg-surface-pearl flex items-center justify-between">
                  <h3 className="font-body-strong text-sm text-ink">{getDayName(dayNum)}</h3>
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                    {daySchedules.length} Ca học Live
                  </span>
                </div>
                <div className="p-5 flex flex-col gap-6">
                  {daySchedules.length === 0 ? (
                    <p className="text-xs text-ink-muted-48 font-caption italic py-4 text-center">Không có lịch dạy / Livestream</p>
                  ) : (
                    daySchedules.map((s) => (
                      <div key={s.id} className="border-b border-divider-soft last:border-0 pb-5 last:pb-0 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold bg-primary text-white px-2 py-0.5 rounded">
                                {s.courseName}
                              </span>
                              <span className="text-xs font-caption text-ink-muted-48">Kênh: {s.platform}</span>
                            </div>
                            <h4 className="text-sm font-body-strong text-ink mt-1">{s.topicName}</h4>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-red-600 font-mono font-bold bg-red-50 px-2.5 py-1 rounded">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{s.time}</span>
                          </div>
                        </div>

                        {/* Interactive Buttons like tyhh.net */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <a
                            href={s.documentUrl}
                            download
                            className="flex items-center gap-1.5 bg-surface-pearl border border-divider-soft text-ink-muted-80 hover:text-ink hover:bg-divider-soft px-3 py-1.5 rounded text-[11px] font-body transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Tải tài liệu
                          </a>
                          <a
                            href={s.homeworkUrl}
                            className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded text-[11px] font-body transition-colors"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Điểm danh & Nộp bài tập
                          </a>
                          <button
                            onClick={() => alert("Chuyển hướng đến Livestream Group Facebook")}
                            className="flex items-center gap-1.5 bg-primary hover:bg-primary-focus text-white px-3 py-1.5 rounded text-[11px] font-body-strong transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Xem Live chữa
                          </button>
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
