import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ExternalLink, BookOpen, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentDocumentsPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/login");

  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: session.userId },
    include: { classes: true },
  });

  if (!studentProfile || studentProfile.classes.length === 0) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold text-ink mb-4">Tài liệu học tập</h1>
        <p className="text-ink-muted-48">Bạn chưa được xếp vào lớp học nào.</p>
      </div>
    );
  }

  const classIds = studentProfile.classes.map((c) => c.id);

  const schedules = await db.schedule.findMany({
    where: { classId: { in: classIds } },
    include: {
      class: true,
      subject: true,
      teacher: { include: { user: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  interface DocItem {
    type: "material" | "homework";
    title: string;
    url: string;
    className: string;
    subjectName: string;
    teacherName: string;
    dayLabel: string;
    time: string;
  }

  const DAYS = ["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
  const docs: DocItem[] = [];

  for (const schedule of schedules) {
    if (schedule.materials) {
      docs.push({
        type: "material",
        title: `${schedule.subject.name} - Bài giảng`,
        url: schedule.materials,
        className: schedule.class.name,
        subjectName: schedule.subject.name,
        teacherName: schedule.teacher.user.name,
        dayLabel: DAYS[schedule.dayOfWeek] || "",
        time: `${schedule.startTime} - ${schedule.endTime}`,
      });
    }
    if (schedule.homework) {
      docs.push({
        type: "homework",
        title: `${schedule.subject.name} - BTVN`,
        url: schedule.homework,
        className: schedule.class.name,
        subjectName: schedule.subject.name,
        teacherName: schedule.teacher.user.name,
        dayLabel: DAYS[schedule.dayOfWeek] || "",
        time: `${schedule.startTime} - ${schedule.endTime}`,
      });
    }
  }

  const byClass: Record<string, DocItem[]> = {};
  for (const doc of docs) {
    if (!byClass[doc.className]) byClass[doc.className] = [];
    byClass[doc.className].push(doc);
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-ink mb-6">Tài liệu học tập của tôi</h1>

      {docs.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-ink-muted-48 mx-auto mb-3" />
          <p className="text-sm text-ink-muted-48">Chưa có tài liệu nào cho lớp của bạn.</p>
        </div>
      ) : (
        Object.entries(byClass).map(([className, classDocs]) => (
          <div key={className} className="mb-8">
            <h2 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {className}
            </h2>
            <div className="space-y-2">
              {classDocs.map((doc, i) => (
                <a
                  key={i}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-hairline hover:shadow-sm hover:border-blue-200 transition-all group"
                >
                  <div className={`p-2 rounded-lg ${doc.type === "material" ? "bg-blue-50" : "bg-amber-50"}`}>
                    {doc.type === "material" ? (
                      <BookOpen className="w-4 h-4 text-blue-500" />
                    ) : (
                      <GraduationCap className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate group-hover:text-blue-600 transition-colors">
                      {doc.title}
                    </p>
                    <p className="text-[11px] text-ink-muted-48 mt-0.5">
                      {doc.subjectName} - {doc.teacherName} - {doc.dayLabel} {doc.time}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-ink-muted-48 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
