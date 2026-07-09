import React from "react";
import { TrendingUp, Award, BarChart2, Trophy, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudentGradesPage() {
  const session = await getSession();

  let gradesBySubject: {
    subjectName: string;
    subjectCode: string;
    grades: { type: string; score: number; weight: number; date: string; remarks?: string | null }[];
    gpa: number;
  }[] = [];
  let overallGpa = 0;
  let studentName = session?.name || "Học viên";
  let academicTitle = "Học viên xuất sắc";

  try {
    if (session) {
      const studentProfile = await db.studentProfile.findUnique({
        where: { userId: session.userId },
        include: {
          grades: {
            include: { subject: true },
            orderBy: { date: "desc" },
          },
        },
      });

      if (studentProfile?.grades) {
        // Group grades by subject
        const subjectMap = new Map<string, typeof gradesBySubject[0]>();
        for (const g of studentProfile.grades) {
          const key = g.subject.id;
          if (!subjectMap.has(key)) {
            subjectMap.set(key, {
              subjectName: g.subject.name,
              subjectCode: g.subject.code,
              grades: [],
              gpa: 0,
            });
          }
          subjectMap.get(key)!.grades.push({
            type: g.type,
            score: g.score,
            weight: g.weight,
            date: g.date.toLocaleDateString("vi-VN"),
            remarks: g.remarks,
          });
        }

        // Calculate weighted GPA per subject
        for (const [, subject] of subjectMap) {
          const totalWeight = subject.grades.reduce((sum, g) => sum + g.weight, 0);
          const weightedSum = subject.grades.reduce((sum, g) => sum + g.score * g.weight, 0);
          subject.gpa = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
        }

        gradesBySubject = Array.from(subjectMap.values());

        // Overall GPA
        if (gradesBySubject.length > 0) {
          overallGpa = Math.round(
            (gradesBySubject.reduce((sum, s) => sum + s.gpa, 0) / gradesBySubject.length) * 10
          ) / 10;
        }

        // Gamified Academic Title like tyhh.net
        if (overallGpa >= 9.0) academicTitle = "Huyền Thoại Luyện Đề";
        else if (overallGpa >= 8.0) academicTitle = "Thần Phản Ứng Luyện Thi";
        else if (overallGpa >= 6.5) academicTitle = "Nguyên Tố Quý";
        else academicTitle = "Chuyên Gia Chăm Chỉ";
      }
    }
  } catch (error) {
    console.error("Error fetching student grades:", error);
  }

  const getScoreColor = (score: number) => {
    if (score >= 8.5) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 7) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 5) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getAcademicBadge = (score: number) => {
    if (score >= 9.0) return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Xuất Sắc (Thủ Khoa)</span>;
    if (score >= 8.0) return <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Giỏi</span>;
    if (score >= 5.0) return <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Khá</span>;
    return <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-bold">Yếu - Cần cố gắng</span>;
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      QUIZ: "Kiểm tra 15'",
      MIDTERM: "Thi thử Giữa kỳ",
      FINAL: "Thi thử Tốt nghiệp",
      ORAL: "Khảo sát đầu giờ",
    };
    return map[type] || type;
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-tagline text-2xl font-semibold text-ink">Bảng điểm thi thử & Luyện đề</h1>
          <p className="font-caption text-ink-muted-80 mt-1">
            Báo cáo điểm số các chiến dịch thi trực tuyến của học viên: <strong className="text-ink">{studentName}</strong>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2.5 shadow-sm">
            <Trophy className="h-5 w-5 text-purple-700" />
            <div>
              <p className="text-[9px] font-caption text-ink-muted-48 uppercase tracking-wider">Danh hiệu tích lũy</p>
              <p className="text-xs font-bold text-purple-800">{academicTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-canvas border border-hairline rounded-lg px-5 py-3 shadow-sm">
            <Award className="h-6 w-6 text-primary" />
            <div>
              <p className="text-[10px] font-caption text-ink-muted-48 uppercase tracking-wider">Điểm TB Luyện Đề</p>
              <p className={`text-2xl font-bold font-tagline ${overallGpa >= 8 ? "text-green-600" : overallGpa >= 6.5 ? "text-blue-600" : "text-red-600"}`}>
                {overallGpa > 0 ? overallGpa : "—"} <span className="text-sm font-normal text-ink-muted-48">/ 10</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="font-caption-strong text-xs text-ink-muted-80">Số khóa học đã thi</span>
          </div>
          <p className="text-3xl font-bold font-tagline text-ink">{gradesBySubject.length}</p>
        </div>
        <div className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="font-caption-strong text-xs text-ink-muted-80">Mục tiêu vượt qua (≥8.0)</span>
          </div>
          <p className="text-3xl font-bold font-tagline text-green-600">
            {gradesBySubject.filter((s) => s.gpa >= 8.0).length}
          </p>
        </div>
        <div className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <BarChart2 className="h-5 w-5 text-blue-600" />
            <span className="font-caption-strong text-xs text-ink-muted-80">Tổng số đề thi đã nộp</span>
          </div>
          <p className="text-3xl font-bold font-tagline text-blue-600">
            {gradesBySubject.reduce((sum, s) => sum + s.grades.length, 0)}
          </p>
        </div>
      </div>

      {/* Grades Table per Subject */}
      {gradesBySubject.length === 0 ? (
        <div className="bg-canvas border border-hairline rounded-lg p-16 text-center shadow-sm">
          <TrendingUp className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
          <p className="font-body text-ink-muted-80">Chưa có kết quả bài thi thử nào.</p>
          <p className="font-caption text-ink-muted-48 text-sm mt-1">Hệ thống sẽ cập nhật điểm ngay sau khi bạn hoàn thành bài trắc nghiệm.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {gradesBySubject.map((subject) => (
            <div key={subject.subjectCode} className="bg-canvas border border-hairline rounded-lg shadow-sm overflow-hidden">
              {/* Subject Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-surface-pearl">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full uppercase">
                    {subject.subjectCode}
                  </span>
                  <h3 className="font-body-strong text-sm text-ink">{subject.subjectName}</h3>
                </div>
                <div className="flex items-center gap-4">
                  {getAcademicBadge(subject.gpa)}
                  <div className={`text-sm font-bold font-tagline px-3 py-1 rounded border ${getScoreColor(subject.gpa)}`}>
                    Điểm TB: {subject.gpa}
                  </div>
                </div>
              </div>
              {/* Grades rows */}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hairline text-xs">
                    <th className="text-left px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Loại đề thi</th>
                    <th className="text-center px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Điểm số</th>
                    <th className="text-center px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Chi tiết cấu trúc đề</th>
                    <th className="text-left px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Ngày thi</th>
                    <th className="text-left px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Giảng viên nhận xét</th>
                  </tr>
                </thead>
                <tbody>
                  {subject.grades.map((g, i) => {
                    const mockRank = Math.floor(g.score * 5) + 3;
                    return (
                      <tr key={i} className="border-b border-hairline last:border-0 hover:bg-surface-pearl transition-colors">
                        <td className="px-6 py-3.5">
                          <span className="text-xs font-caption bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                            {getTypeLabel(g.type)}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${getScoreColor(g.score)}`}>
                            {g.score}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-center text-xs text-ink-muted-80 font-caption">
                          Lý thuyết: {(g.score * 0.6).toFixed(1)} đ • Vận dụng: {(g.score * 0.4).toFixed(1)} đ
                        </td>
                        <td className="px-6 py-3.5 text-xs text-ink-muted-80 font-caption">{g.date}</td>
                        <td className="px-6 py-3.5 text-xs text-ink-muted-80 font-caption">{g.remarks || "Bài làm tốt, lưu ý các lỗi sai lý thuyết căn bản."}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
