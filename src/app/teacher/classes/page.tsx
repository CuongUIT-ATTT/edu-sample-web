/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import ClassManagementList from "@/components/ClassManagementList";
import { getSession } from "@/lib/auth";
import { teacherClassIds as getTeacherClassIds } from "@/lib/teacher-classes";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TeacherClassesPage() {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    redirect("/login");
  }

  const teacherProfile = await db.teacherProfile.findUnique({
    where: { userId: session.userId }
  });

  if (!teacherProfile) {
    redirect("/login");
  }

  // Lớp phụ trách: chủ nhiệm HOẶC có dạy (scheduleSeries) — dùng helper chung
  const teacherClassIds = await getTeacherClassIds(session.userId);

  const classesList = await db.class.findMany({
    where: {
      id: { in: teacherClassIds }
    },
    include: {
      formTeacher: {
        include: { user: true },
      },
      students: {
        include: {
          user: true,
          classes: true,
        },
      },
      _count: {
        select: { students: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const teachers = await db.teacherProfile.findMany({
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  // Teacher can only add students who are already in at least one class of this teacher
  const allStudents = await db.studentProfile.findMany({
    where: {
      classes: {
        some: { id: { in: teacherClassIds } }
      }
    },
    include: {
      user: true,
      classes: true,
    },
    orderBy: { user: { name: "asc" } },
  });

  const handleCreateClass = async (formData: FormData) => {
    "use server";
    const name = formData.get("name") as string;
    const gradeLevel = parseInt(formData.get("gradeLevel") as string);
    const formTeacherId = formData.get("formTeacherId") as string;

    if (!name || isNaN(gradeLevel)) return;

    try {
      await db.class.create({
        data: {
          name,
          gradeLevel,
          formTeacherId: formTeacherId || null,
        },
      });
      revalidatePath("/teacher/classes");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <ClassManagementList
        initialClasses={classesList as any}
        teachers={teachers as any}
        allStudents={allStudents as any}
        createClassAction={handleCreateClass}
      />
    </div>
  );
}
