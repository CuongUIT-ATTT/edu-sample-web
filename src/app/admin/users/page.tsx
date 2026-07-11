/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { db } from "@/lib/db";
import UserManagementTable from "@/components/UserManagementTable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  // Query all users
  const dbUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      studentProfile: {
        include: {
          class: true,
        },
      },
    },
  });

  // Query classes for filtering and creation/editing
  const classes = await db.class.findMany({
    orderBy: { name: "asc" },
  });

  // Query parent profiles
  const parents = await db.parentProfile.findMany({
    include: {
      user: true,
    },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">Quản lý người dùng</h1>
        <p className="font-caption text-ink-muted-80 mt-1">
          Cấp phát, cập nhật (CRUD), lọc vai trò, và nhập danh sách học viên hàng loạt.
        </p>
      </div>

      <UserManagementTable
        users={dbUsers as any}
        classes={classes}
        parents={parents as any}
      />
    </div>
  );
}
