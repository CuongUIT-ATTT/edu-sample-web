/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { db } from "@/lib/db";
import SubjectManagement from "@/components/SubjectManagement";

export const dynamic = "force-dynamic";

export default async function AdminSubjectsPage() {
  const subjects = await db.subject.findMany({
    include: {
      _count: {
        select: { schedules: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <SubjectManagement subjects={subjects as any} />
    </div>
  );
}
