import React from "react";
import { db } from "@/lib/db";
import RoomManagement from "@/components/RoomManagement";

export const dynamic = "force-dynamic";

export default async function AdminRoomsPage() {
  const rooms = await db.room.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <RoomManagement rooms={rooms} />
    </div>
  );
}
