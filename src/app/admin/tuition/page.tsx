import React from "react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TuitionAdminClient from "./TuitionAdminClient";

export const dynamic = "force-dynamic";

export default async function TuitionPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const classes = await db.class.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { students: true } } },
  });

  const setting = await db.tuitionFeeSetting.findFirst({ orderBy: { updatedAt: "desc" } });
  const pricePerPeriod = setting?.pricePerPeriod ?? 15000;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-tagline text-2xl font-semibold text-ink">Quản lý Học phí</h1>
          <p className="font-caption text-ink-muted-80 mt-1">Tính học phí theo buổi học • Giá tiết: {pricePerPeriod.toLocaleString()}đ/45p</p>
        </div>
      </div>
      <TuitionAdminClient classes={classes} initialPrice={pricePerPeriod} />
    </div>
  );
}
