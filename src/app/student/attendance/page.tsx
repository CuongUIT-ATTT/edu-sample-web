import React from "react";
import { CheckSquare, Calendar, Users, AlertCircle } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";


export default async function StudentAttendancePage() {
  const session = await getSession();

  let attendances: { id: string; date: string; status: string; remarks?: string | null }[] = [];
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;
  let studentName = session?.name || "Há»c sinh";

  try {
    if (session) {
      const studentProfile = await db.studentProfile.findUnique({
        where: { userId: session.userId },
        include: {
          attendances: {
            orderBy: { date: "desc" },
            take: 60,
          },
        },
      });

      if (studentProfile?.attendances) {
        attendances = studentProfile.attendances.map((a) => ({
          id: a.id,
          date: a.date.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
          status: a.status,
          remarks: a.remarks,
        }));
        presentCount = attendances.filter((a) => a.status === "PRESENT").length;
        absentCount = attendances.filter((a) => a.status === "ABSENT").length;
        lateCount = attendances.filter((a) => a.status === "LATE").length;
        excusedCount = attendances.filter((a) => a.status === "EXCUSED").length;
      }
    }
  } catch (error) {
    console.error("Error fetching student attendance:", error);
  }

  const total = attendances.length;
  const attendanceRate = total > 0 ? Math.round((presentCount / total) * 1000) / 10 : 0;

  const statusConfig: Record<string, { label: string; classes: string }> = {
    PRESENT: { label: "CÃ³ máº·t", classes: "bg-green-50 text-green-700 border border-green-200" },
    ABSENT: { label: "Váº¯ng máº·t", classes: "bg-red-50 text-red-700 border border-red-200" },
    LATE: { label: "Äi trá»…", classes: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
    EXCUSED: { label: "CÃ³ phÃ©p", classes: "bg-blue-50 text-blue-700 border border-blue-200" },
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">ChuyÃªn cáº§n</h1>
        <p className="font-caption text-ink-muted-80 mt-1">Lá»‹ch sá»­ Ä‘iá»ƒm danh â€” {studentName}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="h-4 w-4 text-green-600" />
            <span className="text-[11px] font-caption-strong text-ink-muted-48 uppercase">CÃ³ máº·t</span>
          </div>
          <p className="text-3xl font-bold font-tagline text-green-600">{presentCount}</p>
        </div>
        <div className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-[11px] font-caption-strong text-ink-muted-48 uppercase">Váº¯ng máº·t</span>
          </div>
          <p className="text-3xl font-bold font-tagline text-red-600">{absentCount}</p>
        </div>
        <div className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-yellow-600" />
            <span className="text-[11px] font-caption-strong text-ink-muted-48 uppercase">Äi trá»…</span>
          </div>
          <p className="text-3xl font-bold font-tagline text-yellow-600">{lateCount + excusedCount}</p>
        </div>
        <div className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-[11px] font-caption-strong text-ink-muted-48 uppercase">Tá»‰ lá»‡ chuyÃªn cáº§n</span>
          </div>
          <p className={`text-3xl font-bold font-tagline ${attendanceRate >= 90 ? "text-green-600" : attendanceRate >= 75 ? "text-yellow-600" : "text-red-600"}`}>
            {total > 0 ? `${attendanceRate}%` : "â€”"}
          </p>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-canvas border border-hairline rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline bg-surface-pearl">
          <h2 className="font-body-strong text-sm text-ink">Lá»‹ch sá»­ Ä‘iá»ƒm danh ({total} báº£n ghi)</h2>
        </div>
        {attendances.length === 0 ? (
          <div className="p-16 text-center">
            <CheckSquare className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
            <p className="font-body text-ink-muted-80">ChÆ°a cÃ³ dá»¯ liá»‡u Ä‘iá»ƒm danh.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-hairline">
                <th className="text-left px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">NgÃ y</th>
                <th className="text-center px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Tráº¡ng thÃ¡i</th>
                <th className="text-left px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Ghi chÃº</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map((a) => (
                <tr key={a.id} className="border-b border-hairline last:border-0 hover:bg-surface-pearl transition-colors">
                  <td className="px-6 py-3 text-sm text-ink font-caption">{a.date}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`text-xs font-caption-strong px-3 py-1 rounded-full ${statusConfig[a.status]?.classes}`}>
                      {statusConfig[a.status]?.label || a.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-ink-muted-80 font-caption">{a.remarks || "â€”"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
