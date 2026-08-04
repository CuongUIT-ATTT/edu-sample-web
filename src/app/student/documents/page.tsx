import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDocumentsForStudent } from "@/actions/documents";
import { BookOpen } from "lucide-react";
import DocumentsClient from "./DocumentsClient";

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

  const [schedules, classDocsResult] = await Promise.all([
    db.scheduleSeries.findMany({
      where: { classId: { in: classIds } },
      include: {
        class: true,
        subject: true,
        teacher: { include: { user: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    getDocumentsForStudent(classIds),
  ]);

  const classDocs = classDocsResult.success ? classDocsResult.data ?? [] : [];

  interface DocItem {
    id: string;
    type: "material" | "homework" | "class_doc";
    title: string;
    url: string;
    classId: string | null; // null = doc public (dùng chung mọi lớp)
    className: string;
    subjectName: string;
    teacherName: string;
    dayLabel: string;
    time: string;
    isPublic: boolean;
  }

  const DAYS = ["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
  const docs: DocItem[] = [];

  for (const schedule of schedules) {
    if (schedule.materials) {
      docs.push({
        id: `${schedule.id}-material`,
        type: "material",
        title: `${schedule.subject.name} - Bài giảng`,
        url: schedule.materials,
        classId: schedule.classId,
        className: schedule.class.name,
        subjectName: schedule.subject.name,
        teacherName: schedule.teacher.user.name,
        dayLabel: DAYS[schedule.dayOfWeek] || "",
        time: `${schedule.startTime} - ${schedule.endTime}`,
        isPublic: false,
      });
    }
    if (schedule.homework) {
      docs.push({
        id: `${schedule.id}-homework`,
        type: "homework",
        title: `${schedule.subject.name} - BTVN`,
        url: schedule.homework,
        classId: schedule.classId,
        className: schedule.class.name,
        subjectName: schedule.subject.name,
        teacherName: schedule.teacher.user.name,
        dayLabel: DAYS[schedule.dayOfWeek] || "",
        time: `${schedule.startTime} - ${schedule.endTime}`,
        isPublic: false,
      });
    }
  }

  // Class documents: published → 1 item public (dùng chung mọi lớp); không published → 1 item mỗi lớp student được gán
  const myClassIdSet = new Set(classIds);
  for (const doc of classDocs) {
    if (doc.published) {
      docs.push({
        id: `${doc.id}-public`,
        type: "class_doc",
        title: doc.title,
        url: doc.fileUrl,
        classId: null,
        className: "",
        subjectName: doc.category,
        teacherName: "",
        dayLabel: "",
        time: "",
        isPublic: true,
      });
    } else {
      for (const cv of doc.classVisibility ?? []) {
        if (myClassIdSet.has(cv.class.id)) {
          docs.push({
            id: `${doc.id}-${cv.class.id}`,
            type: "class_doc",
            title: doc.title,
            url: doc.fileUrl,
            classId: cv.class.id,
            className: cv.class.name,
            subjectName: doc.category,
            teacherName: "",
            dayLabel: "",
            time: "",
            isPublic: false,
          });
        }
      }
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-ink mb-6">Tài liệu học tập của tôi</h1>
      <DocumentsClient
        classes={[...studentProfile.classes]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((c) => ({ id: c.id, name: c.name }))}
        docs={docs}
      />
    </div>
  );
}
