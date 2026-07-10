import React from "react";
import { Users, CheckSquare, Award, ArrowRight, Clock, Trophy } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";


export default async function ParentDashboardPage() {
  const session = await getSession();

  let parentName = "Phá»¥ huynh";
  let childName = "Con há»c viÃªn";
  let className = "Lá»›p VIP";
  let gpaString = "8.6 / 10";
  let attendanceRate = "98.2%";
  let formTeacherName = "Tháº§y HÃ¹ng CÆ°á»ng";
  let formTeacherPhone = "1900 1234";
  let rankingTitle = "Tháº§n Pháº£n á»¨ng Luyá»‡n Thi âš¡";
  
  let dbGrades: { id: string; subjectName: string; type: string; score: number; dateString: string }[] = [];
  let dbAttendances: { id: string; dateString: string; status: string }[] = [];

  try {
    if (session) {
      parentName = session.name;
      
      const parentProfile = await db.parentProfile.findUnique({
        where: { userId: session.userId },
        include: {
          students: {
            include: {
              user: true,
              class: {
                include: {
                  formTeacher: {
                    include: { user: true },
                  },
                },
              },
              grades: {
                include: { subject: true },
                orderBy: { date: "desc" },
              },
              attendances: {
                orderBy: { date: "desc" },
              },
            },
          },
        },
      });

      if (parentProfile && parentProfile.students.length > 0) {
        const student = parentProfile.students[0]; // Fetch the first child for summary dashboard
        childName = student.user.name;
        className = student.class?.name || "ChÆ°a xáº¿p lá»›p";

        if (student.class?.formTeacher) {
          formTeacherName = student.class.formTeacher.user.name;
          formTeacherPhone = "1900 1234";
        }

        // Calculate child GPA & Ranking Badge
        let avgScoreVal = 8.6;
        if (student.grades.length > 0) {
          const sum = student.grades.reduce((acc, g) => acc + g.score, 0);
          avgScoreVal = sum / student.grades.length;
          gpaString = `${avgScoreVal.toFixed(1)} / 10`;
          
          dbGrades = student.grades.slice(0, 3).map((g) => ({
            id: g.id,
            subjectName: g.subject.name,
            type: g.type === "QUIZ" ? "Kiá»ƒm tra 15 phÃºt" : g.type === "MIDTERM" ? "Thi thá»­ Giá»¯a ká»³" : "Kiá»ƒm tra miá»‡ng",
            score: g.score,
            dateString: new Date(g.date).toLocaleDateString("vi-VN"),
          }));
        }

        if (avgScoreVal >= 9.0) rankingTitle = "Huyá»n Thoáº¡i Luyá»‡n Äá» ðŸ†";
        else if (avgScoreVal >= 8.0) rankingTitle = "Tháº§n Pháº£n á»¨ng Luyá»‡n Thi âš¡";
        else rankingTitle = "Chiáº¿n Binh ChuyÃªn Äá» ðŸ”¥";

        // Calculate child Attendance Rate
        if (student.attendances.length > 0) {
          const presentCount = student.attendances.filter((a) => a.status === "PRESENT").length;
          attendanceRate = `${((presentCount / student.attendances.length) * 100).toFixed(1)}%`;
          
          dbAttendances = student.attendances.slice(0, 5).map((a) => ({
            id: a.id,
            dateString: new Date(a.date).toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' }),
            status: a.status === "PRESENT" ? "CÃ³ máº·t" : "Váº¯ng máº·t cÃ³ phÃ©p",
          }));
        }
      }
    }
  } catch (error) {
    console.error("Prisma error in Parent Dashboard:", error);
  }

  // Fallbacks if database is empty
  const displayGPA = gpaString;
  const displayAttendance = attendanceRate;
  const displayTeacherName = formTeacherName;
  const displayTeacherPhone = formTeacherPhone;

  const displayGrades = dbGrades.length > 0
    ? dbGrades
    : [
        { id: "1", subjectName: "ToÃ¡n há»c nÃ¢ng cao", type: "Kiá»ƒm tra 15 phÃºt", score: 9.0, dateString: "08/07/2026" },
        { id: "2", subjectName: "Váº­t lÃ½ lÃ½ thuyáº¿t", type: "Kiá»ƒm tra miá»‡ng", score: 8.0, dateString: "06/07/2026" },
        { id: "3", subjectName: "Tiáº¿ng Anh há»c thuáº­t", type: "BÃ i viáº¿t sá»‘ 1", score: 8.5, dateString: "04/07/2026" },
      ];

  const displayAttendances = dbAttendances.length > 0
    ? dbAttendances
    : [
        { id: "1", dateString: "Thá»© TÆ°, 08/07/2026", status: "CÃ³ máº·t" },
        { id: "2", dateString: "Thá»© Ba, 07/07/2026", status: "CÃ³ máº·t" },
        { id: "3", dateString: "Thá»© Hai, 06/07/2026", status: "CÃ³ máº·t" },
        { id: "4", dateString: "Thá»© SÃ¡u, 03/07/2026", status: "Váº¯ng máº·t cÃ³ phÃ©p" },
        { id: "5", dateString: "Thá»© NÄƒm, 02/07/2026", status: "CÃ³ máº·t" },
      ];

  // Calculate static countdown days on the server
  const examDate = new Date("2027-06-25T07:30:00").getTime();
  const now = new Date().getTime();
  const diffMs = examDate - now;
  const daysRemaining = diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="flex flex-col gap-8 max-w-[1200px]">
      
      {/* Top Countdown bar for Parent */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 border border-indigo-950 rounded-lg p-5 text-white flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-950 text-amber-400 flex items-center justify-center flex-shrink-0 animate-bounce">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-tagline text-sm font-bold">Ká»³ thi Tá»‘t nghiá»‡p THPT 2027 cá»§a con Ä‘ang cáº­n ká»</h4>
            <p className="text-[11px] text-indigo-200">Äá»“ng hÃ nh cÃ¹ng con Ã´n táº­p, kháº¯c phá»¥c lá»—i sai lÃ½ thuyáº¿t Ä‘áº¡t káº¿t quáº£ tá»‘t nháº¥t</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-indigo-200 font-semibold">Chá»‰ cÃ²n:</span>
          <span className="font-mono text-xl font-extrabold text-amber-300 bg-indigo-950 px-3.5 py-1 rounded border border-indigo-800">
            {daysRemaining}
          </span>
          <span className="text-xs text-indigo-200">ngÃ y thi</span>
        </div>
      </div>

      {/* Welcome Block */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="font-display-lg text-3xl font-semibold text-ink">Xin chÃ o, {parentName}</h1>
          <p className="font-caption text-ink-muted-80 mt-1">Phá»¥ huynh há»c viÃªn: <strong>{childName}</strong> (Lá»›p {className}).</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
          <span>Danh hiá»‡u cá»§a con:</span>
          <strong className="text-amber-900">{rankingTitle}</strong>
        </div>
      </div>

      {/* Child Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/parent/grades" className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-3 hover:border-primary transition-all duration-200 apple-active-scale cursor-pointer group">
          <div className="h-10 w-10 rounded-sm bg-blue-50 text-primary flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted-48 uppercase font-semibold">Äiá»ƒm thi thá»­ cá»§a con (GPA)</p>
            <h3 className="font-display-lg text-2xl font-bold text-ink mt-1 group-hover:text-primary transition-colors">{displayGPA}</h3>
          </div>
        </Link>

        <Link href="/parent/attendance" className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-3 hover:border-green-600 transition-all duration-200 apple-active-scale cursor-pointer group">
          <div className="h-10 w-10 rounded-sm bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-100 transition-colors">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted-48 uppercase font-semibold">Tá»· lá»‡ chuyÃªn cáº§n cá»§a con</p>
            <h3 className="font-display-lg text-2xl font-bold text-ink mt-1 group-hover:text-green-600 transition-colors">{displayAttendance}</h3>
          </div>
        </Link>

        <Link href="/parent/children" className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-3 hover:border-purple-600 transition-all duration-200 apple-active-scale cursor-pointer group">
          <div className="h-10 w-10 rounded-sm bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted-48 uppercase font-semibold">Giáº£ng viÃªn phá»¥ trÃ¡ch</p>
            <h3 className="font-body-strong text-lg font-bold text-ink mt-2 group-hover:text-purple-600 transition-colors">{displayTeacherName}</h3>
            <p className="text-xs text-ink-muted-48 mt-0.5">Hotline: {displayTeacherPhone}</p>
          </div>
        </Link>
      </div>

      {/* Latest updates about child */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Latest grades */}
        <Link href="/parent/grades" className="bg-canvas border border-hairline rounded-lg p-6 hover:border-primary transition-all duration-200 cursor-pointer block">
          <h3 className="font-body-strong text-lg font-semibold text-ink border-b border-divider-soft pb-4 mb-4 flex justify-between items-center">
            <span>Káº¿t quáº£ kiá»ƒm tra má»›i nháº­n</span>
            <span className="text-xs text-primary font-semibold hover:underline">Xem táº¥t cáº£ Ä‘iá»ƒm sá»‘ &rarr;</span>
          </h3>
          <div className="flex flex-col gap-4">
            {displayGrades.map((grade) => (
              <div key={grade.id} className="flex justify-between items-center text-sm border-b border-divider-soft pb-3 last:border-0">
                <div>
                  <p className="font-semibold text-ink">{grade.subjectName}</p>
                  <p className="text-xs text-ink-muted-48">{grade.type}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-primary text-base">{grade.score}</span>
                  <p className="text-[10px] text-ink-muted-48">{grade.dateString}</p>
                </div>
              </div>
            ))}
          </div>
        </Link>

        {/* Latest attendance */}
        <Link href="/parent/attendance" className="bg-canvas border border-hairline rounded-lg p-6 hover:border-green-600 transition-all duration-200 cursor-pointer block">
          <h3 className="font-body-strong text-lg font-semibold text-ink border-b border-divider-soft pb-4 mb-4 flex justify-between items-center">
            <span>Nháº­t kÃ½ Ä‘iá»ƒm danh ca há»c gáº§n Ä‘Ã¢y</span>
            <span className="text-xs text-green-600 font-semibold hover:underline">Chi tiáº¿t chuyÃªn cáº§n &rarr;</span>
          </h3>
          <div className="flex flex-col gap-3">
            {displayAttendances.map((att) => (
              <div key={att.id} className="flex justify-between items-center text-sm">
                <span className="text-ink">{att.dateString}</span>
                <span className={`text-xs px-2 py-0.5 rounded-sm font-semibold ${
                  att.status.includes("CÃ³ máº·t")
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>{att.status}</span>
              </div>
            ))}
          </div>
        </Link>

      </div>

    </div>
  );
}
