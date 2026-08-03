"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal, ChevronDown, Users } from "lucide-react";

interface ClassItem {
  id: string;
  name: string;
}

interface SubjectItem {
  id: string;
  name: string;
}

interface RankedStudent {
  id: string;
  name: string;
  avgScore: number | null;
  gradesCount: number;
  badge: string;
}

interface LeaderboardClientProps {
  classes: ClassItem[];
  subjects: SubjectItem[];
}

const MEDAL_COLORS = [
  "text-yellow-500",
  "text-amber-600",
  "text-slate-400",
];

const MEDAL_BG = [
  "bg-yellow-50 border-yellow-200",
  "bg-amber-50 border-amber-200",
  "bg-slate-50 border-slate-200",
];

export default function LeaderboardClient({ classes, subjects }: LeaderboardClientProps) {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [ranking, setRanking] = useState<RankedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    if (!selectedClass || !selectedSubject) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/student/leaderboard?classId=${encodeURIComponent(selectedClass)}&subjectId=${encodeURIComponent(selectedSubject)}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lỗi tải bảng xếp hạng");
      setRanking(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchLeaderboard();
    }
  }, [selectedClass, selectedSubject]);

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ink">Lớp học</label>
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-canvas border border-hairline rounded-lg px-3 pr-9 py-2.5 text-xs text-ink outline-none focus:border-primary-focus w-full appearance-none"
            >
              <option value="">-- Chọn lớp --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted-48 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ink">Môn học</label>
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-canvas border border-hairline rounded-lg px-3 pr-9 py-2.5 text-xs text-ink outline-none focus:border-primary-focus w-full appearance-none"
            >
              <option value="">-- Chọn môn --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted-48 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content */}
      {!selectedClass || !selectedSubject ? (
        <div className="bg-canvas border border-hairline rounded-lg p-16 text-center shadow-sm flex flex-col items-center gap-3">
          <Trophy className="h-14 w-14 text-yellow-400 opacity-60" />
          <p className="text-sm text-ink-muted-80 font-body">
            Chọn lớp học và môn học để xem bảng xếp hạng
          </p>
        </div>
      ) : loading ? (
        <div className="bg-canvas border border-hairline rounded-lg p-16 text-center shadow-sm flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-ink-muted-80">Đang tải bảng xếp hạng...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      ) : ranking.length === 0 ? (
        <div className="bg-canvas border border-hairline rounded-lg p-16 text-center shadow-sm flex flex-col items-center gap-3">
          <Users className="h-12 w-12 text-ink-muted-48" />
          <p className="text-sm text-ink-muted-80">Chưa có dữ liệu điểm cho lớp và môn học này.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Top 3 podium */}
          {ranking.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 mb-2">
              {/* 2nd place */}
              <div className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${MEDAL_BG[1]}`}>
                <span className="text-3xl font-black text-amber-600">#2</span>
                <Medal className={`h-6 w-6 ${MEDAL_COLORS[1]}`} />
                <p className="text-xs font-semibold text-ink text-center line-clamp-2">{ranking[1]?.name}</p>
                <p className="text-lg font-black text-ink">{ranking[1]?.avgScore?.toFixed(1) ?? "—"}</p>
                <p className="text-[10px] text-ink-muted-48">{ranking[1]?.badge}</p>
              </div>
              {/* 1st place */}
              <div className={`flex flex-col items-center gap-2 p-5 rounded-lg border ${MEDAL_BG[0]} shadow-sm -mt-3`}>
                <span className="text-4xl font-black text-yellow-500">#1</span>
                <Trophy className="h-8 w-8 text-yellow-500" />
                <p className="text-xs font-bold text-ink text-center line-clamp-2">{ranking[0]?.name}</p>
                <p className="text-2xl font-black text-ink">{ranking[0]?.avgScore?.toFixed(1) ?? "—"}</p>
                <p className="text-[10px] text-ink-muted-48">{ranking[0]?.badge}</p>
              </div>
              {/* 3rd place */}
              <div className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${MEDAL_BG[2]}`}>
                <span className="text-3xl font-black text-slate-400">#3</span>
                <Medal className={`h-6 w-6 ${MEDAL_COLORS[2]}`} />
                <p className="text-xs font-semibold text-ink text-center line-clamp-2">{ranking[2]?.name}</p>
                <p className="text-lg font-black text-ink">{ranking[2]?.avgScore?.toFixed(1) ?? "—"}</p>
                <p className="text-[10px] text-ink-muted-48">{ranking[2]?.badge}</p>
              </div>
            </div>
          )}

          {/* Full table */}
          <div className="bg-canvas border border-hairline rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface-pearl border-b border-divider-soft">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-ink-muted-80 w-12">Hạng</th>
                    <th className="text-left px-4 py-3 font-semibold text-ink-muted-80">Học viên</th>
                    <th className="text-center px-4 py-3 font-semibold text-ink-muted-80">TB điểm</th>
                    <th className="text-center px-4 py-3 font-semibold text-ink-muted-80">Số lần KT</th>
                    <th className="text-center px-4 py-3 font-semibold text-ink-muted-80">Thành tích</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((student, idx) => (
                    <tr
                      key={student.id}
                      className={`border-b border-divider-soft last:border-0 hover:bg-surface-pearl transition-colors ${idx < 3 ? "font-semibold" : ""}`}
                    >
                      <td className="px-5 py-3.5">
                        <span className={`font-black text-sm ${idx === 0 ? "text-yellow-500" : idx === 1 ? "text-amber-600" : idx === 2 ? "text-slate-400" : "text-ink-muted-48"}`}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${idx === 0 ? "bg-yellow-100 text-yellow-700" : "bg-blue-50 text-blue-700"}`}>
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-ink font-medium">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`font-black text-base ${(student.avgScore ?? 0) >= 8.0 ? "text-green-600" : (student.avgScore ?? 0) >= 6.5 ? "text-blue-600" : "text-ink-muted-80"}`}>
                          {student.avgScore !== null ? student.avgScore.toFixed(1) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-ink-muted-80">{student.gradesCount}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-[11px] font-semibold text-ink-muted-80">{student.badge}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
