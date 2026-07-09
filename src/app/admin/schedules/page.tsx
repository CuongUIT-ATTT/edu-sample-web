import React from "react";
import { Calendar, Plus, BookOpen, Clock, MapPin, User } from "lucide-react";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export default async function AdminSchedulesPage() {
  const schedules = await db.schedule.findMany({
    include: {
      class: true,
      subject: true,
      teacher: {
        include: { user: true },
      },
    },
    orderBy: [
      { class: { name: "asc" } },
      { dayOfWeek: "asc" },
      { startTime: "asc" },
    ],
  });

  const classes = await db.class.findMany({ orderBy: { name: "asc" } });
  const subjects = await db.subject.findMany({ orderBy: { name: "asc" } });
  const teachers = await db.teacherProfile.findMany({
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  const handleCreateSchedule = async (formData: FormData) => {
    "use server";
    const classId = formData.get("classId") as string;
    const subjectId = formData.get("subjectId") as string;
    const teacherId = formData.get("teacherId") as string;
    const dayOfWeek = parseInt(formData.get("dayOfWeek") as string);
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const room = formData.get("room") as string;

    if (!classId || !subjectId || !teacherId || isNaN(dayOfWeek) || !startTime || !endTime) return;

    try {
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
    } catch (e) {
      console.error(e);
    }
  };

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left List */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <h1 className="font-tagline text-2xl font-semibold text-ink">Quản lý thời khoá biểu</h1>
          <p className="font-caption text-ink-muted-80 mt-1">Sắp xếp ca dạy, lớp học và phòng học tương ứng</p>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-hairline bg-surface-pearl flex items-center justify-between">
            <h2 className="font-body-strong text-sm text-ink flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Tổng số ca học ({schedules.length} ca)
            </h2>
          </div>
          <div className="divide-y divide-hairline">
            {schedules.length === 0 ? (
              <div className="p-16 text-center">
                <Calendar className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
                <p className="font-body text-ink-muted-80">Chưa có lịch học nào.</p>
              </div>
            ) : (
              schedules.map((s) => (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 hover:bg-surface-pearl transition-colors">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full uppercase">
                        {s.class.name}
                      </span>
                      <h3 className="font-body-strong text-sm text-ink">{s.subject.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted-80 font-caption">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-ink-muted-48" />
                        {getDayName(s.dayOfWeek)} • {s.startTime} - {s.endTime}
                      </span>
                      {s.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-ink-muted-48" />
                          {s.room}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-caption text-ink-muted-80">
                    <User className="h-4 w-4 text-ink-muted-48" />
                    <span>GV: {s.teacher.user.name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-tagline text-lg font-semibold text-ink">Thêm lịch học</h2>
          <p className="font-caption text-ink-muted-80 mt-1">Thiết lập thời gian biểu cho lớp</p>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm">
          <form action={handleCreateSchedule} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Lớp học</label>
              <select
                name="classId"
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                required
              >
                <option value="">— Chọn lớp —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Môn học</label>
              <select
                name="subjectId"
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                required
              >
                <option value="">— Chọn môn —</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Giáo viên giảng dạy</label>
              <select
                name="teacherId"
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                required
              >
                <option value="">— Chọn giáo viên —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.user.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Thứ trong tuần</label>
              <select
                name="dayOfWeek"
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                required
              >
                <option value="1">Thứ Hai (Monday)</option>
                <option value="2">Thứ Ba (Tuesday)</option>
                <option value="3">Thứ Tư (Wednesday)</option>
                <option value="4">Thứ Năm (Thursday)</option>
                <option value="5">Thứ Sáu (Friday)</option>
                <option value="6">Thứ Bảy (Saturday)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Giờ bắt đầu</label>
                <input
                  type="text"
                  name="startTime"
                  placeholder="08:00"
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full text-center"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Giờ kết thúc</label>
                <input
                  type="text"
                  name="endTime"
                  placeholder="09:30"
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full text-center"
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Phòng học (Room)</label>
              <input
                type="text"
                name="room"
                placeholder="Phòng 302, Studio..."
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
              />
            </div>

            <button
              type="submit"
              className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold transition-colors shadow-sm w-full mt-4 flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Tạo lịch học
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
