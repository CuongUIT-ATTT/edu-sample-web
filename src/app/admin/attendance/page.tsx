import React from "react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AttendanceAdminClient from "./AttendanceAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminAttendancePage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const classes = await db.class.findMany({
    orderBy: { name: "asc" },
    include: {
      students: {
        include: { user: { select: { name: true } } },
        orderBy: { user: { name: "asc" } },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">Điểm danh</h1>
        <p className="font-caption text-ink-muted-80 mt-1">
          Điểm danh cho học sinh bất cứ lúc nào — không giới hạn thời gian
        </p>
      </div>
      <AttendanceAdminClient initialClasses={JSON.parse(JSON.stringify(classes))} />
    </div>
  );
}
