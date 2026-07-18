import React from "react";
import { db } from "@/lib/db";
import { Trophy } from "lucide-react";
import LeaderboardClient from "./LeaderboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bảng Xếp Hạng | EduWeb",
};

export default async function StudentLeaderboardPage() {
  const [classes, subjects] = await Promise.all([
    db.class.findMany({ orderBy: { name: "asc" } }),
    db.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-yellow-50 text-yellow-500 flex items-center justify-center">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-tagline text-lg font-bold text-ink">Bảng Xếp Hạng</h1>
          <p className="text-xs text-ink-muted-80">
            Xem thứ hạng học tập theo từng môn học của lớp bạn
          </p>
        </div>
      </div>

      <LeaderboardClient
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
