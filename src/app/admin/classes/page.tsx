/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import ClassManagementList from "@/components/ClassManagementList";

export const dynamic = "force-dynamic";

export default async function AdminClassesPage() {
  const classesList = await db.class.findMany({
    include: {
      formTeacher: {
        include: { user: true },
      },
      students: {
        include: {
          user: true,
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
      revalidatePath("/admin/classes");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <ClassManagementList
        initialClasses={classesList as any}
        teachers={teachers as any}
        createClassAction={handleCreateClass}
      />
    </div>
  );
}
