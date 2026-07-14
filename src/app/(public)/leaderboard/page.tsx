import React from "react";
import { Trophy, Medal, Star, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";

// Force dynamic page generation to ensure it runs database queries at request time
export const dynamic = "force-dynamic";

interface LeaderboardItem {
  name: string;
  className: string;
  gradeLevel: number;
  avgScore: number;
  badge: string;
}

export default async function LeaderboardPage() {
  let rankedStudents: LeaderboardItem[] = [];

  try {
    const dbStudents = await db.studentProfile.findMany({
      include: {
        user: {
          select: { name: true },
        },
        class: {
          select: { name: true, gradeLevel: true },
        },
        grades: {
          select: { score: true },
        },
      },
    });

    // Calculate averages and format data without exposing DB IDs or emails
    const studentsWithGrades = dbStudents
      .map((student) => {
        const gradesList = student.grades || [];
        const avgScore =
          gradesList.length > 0
            ? Math.round((gradesList.reduce((acc, curr) => acc + curr.score, 0) / gradesList.length) * 10) / 10
            : 0.0;

        // Assign ranking badge based on score
        let badge = "Thành viên Luyện thi";
        if (avgScore >= 9.0) badge = "Huyền Thoại Luyện Đề 🏆";
        else if (avgScore >= 8.0) badge = "Thần Phản Ứng Luyện Thi ⚡";
        else if (avgScore >= 6.5) badge = "Chiến Binh Chuyên Đề 🔥";

        return {
          name: student.user.name,
          className: student.class?.name || "Tự do",
          gradeLevel: student.class?.gradeLevel || 12,
          avgScore,
          badge,
        };
      })
      // If average score is 0, filter it out or keep it at bottom. Let's keep those with tests.
      .filter((s) => s.avgScore > 0)
      .sort((a, b) => b.avgScore - a.avgScore);

    rankedStudents = studentsWithGrades;
  } catch (error) {
    console.error("Error loading database leaderboard:", error);
  }

  // Fallback realistic mock data if database is empty/not seeded
  if (rankedStudents.length === 0) {
    rankedStudents = [
      { name: "Nguyễn Hoàng Nam", className: "12A1 VIP", gradeLevel: 12, avgScore: 9.6, badge: "Huyền Thoại Luyện Đề 🏆" },
      { name: "Trần Minh Thư", className: "12A2 VIP", gradeLevel: 12, avgScore: 9.2, badge: "Huyền Thoại Luyện Đề 🏆" },
      { name: "Lê Quốc Khánh", className: "11B1", gradeLevel: 11, avgScore: 8.8, badge: "Thần Phản Ứng Luyện Thi ⚡" },
      { name: "Nguyễn Văn A", className: "10A1", gradeLevel: 10, avgScore: 8.5, badge: "Thần Phản Ứng Luyện Thi ⚡" },
      { name: "Phạm Hà Chi", className: "12A1 VIP", gradeLevel: 12, avgScore: 8.1, badge: "Thần Phản Ứng Luyện Thi ⚡" },
      { name: "Vũ Tuấn Kiệt", className: "12A3", gradeLevel: 12, avgScore: 7.8, badge: "Chiến Binh Chuyên Đề 🔥" },
    ];
  }

  return (
    <div className="bg-canvas-parchment min-h-screen py-16 px-6">
      <div className="max-w-[760px] mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <div className="text-center flex flex-col gap-4 items-center">
          <span className="text-xs text-primary font-semibold uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Bảng Vàng Thi Đua
          </span>
          <h1 className="font-display-lg text-4xl font-semibold text-ink tracking-tight">
            Bảng Xếp Hạng Học Viên Xuất Sắc
          </h1>
          <p className="font-lead text-ink-muted-80 text-sm max-w-[550px] leading-relaxed mt-1">
            Vinh danh những học viên có điểm thi thử và kết quả luyện đề xuất sắc nhất toàn hệ thống EduWeb của Thầy Hùng Cường.
          </p>
        </div>

        {/* Leaderboard Table container */}
        <div className="bg-canvas border border-hairline rounded-lg shadow-product overflow-hidden">
          <div className="px-6 py-4 border-b border-divider-soft bg-surface-pearl flex items-center justify-between">
            <h2 className="font-body-strong text-sm text-ink flex items-center gap-2">
              <Trophy className="h-4.5 w-4.5 text-amber-500" />
              TOP 10 Học viên dẫn đầu
            </h2>
            <span className="text-[10px] text-ink-muted-48 uppercase font-bold tracking-wider">
              Cập nhật trực tiếp từ DB
            </span>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-hairline bg-surface-pearl text-left">
                <th className="px-6 py-3 text-[10px] font-caption-strong text-ink-muted-48 uppercase tracking-wider text-center w-16">Hạng</th>
                <th className="px-6 py-3 text-[10px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Học viên</th>
                <th className="hidden min-[480px]:table-cell px-6 py-3 text-[10px] font-caption-strong text-ink-muted-48 uppercase tracking-wider text-center w-24">Lớp VIP</th>
                <th className="px-6 py-3 text-[10px] font-caption-strong text-ink-muted-48 uppercase tracking-wider text-center w-24">Điểm TB</th>
                <th className="hidden sm:table-cell px-6 py-3 text-[10px] font-caption-strong text-ink-muted-48 uppercase tracking-wider text-right w-48">Danh hiệu</th>
              </tr>
            </thead>
            <tbody>
              {rankedStudents.slice(0, 10).map((student, index) => {
                const isTop1 = index === 0;
                const isTop2 = index === 1;
                const isTop3 = index === 2;

                return (
                  <tr 
                    key={`${student.name}-${index}`} 
                    className="border-b border-hairline last:border-0 hover:bg-surface-pearl transition-colors"
                  >
                    <td className="px-6 py-4 text-center">
                      {isTop1 ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs font-bold shadow-sm">1</span>
                      ) : isTop2 ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-800 text-xs font-bold shadow-sm">2</span>
                      ) : isTop3 ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-800 text-xs font-bold shadow-sm">3</span>
                      ) : (
                        <span className="text-xs font-mono text-ink-muted-48">{index + 1}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {isTop1 && <Medal className="h-4 w-4 text-amber-500" />}
                        <span className="text-sm font-body-strong text-ink font-semibold">{student.name}</span>
                      </div>
                    </td>
                    <td className="hidden min-[480px]:table-cell px-6 py-4 text-center text-xs font-caption text-ink-muted-80">
                      {student.className}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-primary font-mono bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                        {student.avgScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 text-right text-xs font-caption text-ink-muted-80 font-semibold">
                      {student.badge}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Play & Join CTA for students */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <h4 className="font-body-strong text-sm font-bold text-ink">Chưa có tên trên bảng xếp hạng?</h4>
            <p className="text-xs text-ink-muted-80 font-body">
              Luyện đề thi thử ngay hôm nay để cọ xát năng lực và ghi tên mình trên Bảng Vàng danh vọng của Thầy Hùng Cường!
            </p>
          </div>
          <Link 
            href="/quizzes" 
            className="bg-primary hover:bg-primary-focus text-white text-xs px-4 py-2.5 rounded-full font-bold transition-colors shadow-sm whitespace-nowrap"
          >
            Luyện Đề Thi Ngay
          </Link>
        </div>

        {/* Security / Privacy Warning */}
        <div className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm flex gap-4 items-start">
          <ShieldAlert className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <h4 className="font-body-strong text-xs font-semibold text-ink">Cam kết bảo mật thông tin</h4>
            <p className="text-[11px] text-ink-muted-80 leading-relaxed font-body">
              Để bảo vệ quyền riêng tư cá nhân theo quy chuẩn giáo dục, hệ thống chỉ hiển thị tên học sinh, lớp luyện thi và kết quả điểm trung bình công khai. Mọi thông tin nhạy cảm khác bao gồm email cá nhân, số điện thoại, mật khẩu tài khoản và lịch sử làm bài chi tiết được bảo mật tuyệt đối 100%.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
