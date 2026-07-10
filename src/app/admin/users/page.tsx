import React from "react";
import { Users, UserPlus, Shield, User, GraduationCap, Users2, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createUser, deleteUser } from "@/actions/users";
import { Role } from "@prisma/client";

export default async function AdminUsersPage() {
  // Query all data on the server
  const dbUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      studentProfile: {
        include: { class: true },
      },
    },
  });

  const classes = await db.class.findMany({
    orderBy: { name: "asc" },
  });

  const parents = await db.parentProfile.findMany({
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  // Server action handler inside the page or referencing action
  const handleCreateUser = async (formData: FormData) => {
    "use server";
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as Role;
    const password = formData.get("password") as string;
    const classId = formData.get("classId") as string;
    const parentId = formData.get("parentId") as string;

    await createUser({
      email,
      name,
      role,
      password,
      classId: classId || undefined,
      parentId: parentId || undefined,
    });
  };

  const handleDelete = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    if (id) {
      await deleteUser(id);
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="h-4 w-4 text-red-600" />;
      case "TEACHER":
        return <User className="h-4 w-4 text-green-600" />;
      case "STUDENT":
        return <GraduationCap className="h-4 w-4 text-blue-600" />;
      case "PARENT":
        return <Users2 className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getRoleLabel = (role: Role) => {
    const labels: Record<Role, string> = {
      ADMIN: "Admin",
      TEACHER: "Giảng viên",
      STUDENT: "Học viên",
      PARENT: "Phụ huynh",
    };
    return labels[role] || role;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left side: Users list */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <h1 className="font-tagline text-2xl font-semibold text-ink">Quản lý người dùng</h1>
          <p className="font-caption text-ink-muted-80 mt-1">Danh sách tài khoản và phân quyền hệ thống</p>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-hairline bg-surface-pearl flex items-center justify-between">
            <h2 className="font-body-strong text-sm text-ink flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Tổng cộng ({dbUsers.length} tài khoản)
            </h2>
          </div>
          <div className="divide-y divide-hairline">
            {dbUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-pearl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary-muted-12 text-primary flex items-center justify-center">
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <p className="text-sm font-body-strong text-ink">{user.name}</p>
                    <p className="text-xs font-caption text-ink-muted-48">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-caption bg-surface-pearl border border-divider-soft text-ink-muted-80 px-2 py-0.5 rounded-full">
                    {getRoleLabel(user.role)} {user.studentProfile?.class ? `(${user.studentProfile.class.name})` : ""}
                  </span>
                  <form action={handleDelete}>
                    <input type="hidden" name="id" value={user.id} />
                    <button
                      type="submit"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
                      title="Xoá tài khoản"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side: Add user form */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-tagline text-lg font-semibold text-ink">Thêm tài khoản</h2>
          <p className="font-caption text-ink-muted-80 mt-1">Cấp tài khoản mới cho hệ thống trung tâm</p>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm">
          <form action={handleCreateUser} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Họ và tên</label>
              <input
                type="text"
                name="name"
                placeholder="Nguyễn Văn A"
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Email</label>
              <input
                type="email"
                name="email"
                placeholder="example@eduweb.vn"
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Mật khẩu khởi tạo</label>
              <input
                type="password"
                name="password"
                placeholder="Mặc định: Password@2026"
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Vai trò</label>
              <select
                name="role"
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                required
              >
                <option value="STUDENT">Học viên (Student)</option>
                <option value="TEACHER">Giảng viên (Teacher)</option>
                <option value="PARENT">Phụ huynh (Parent)</option>
                <option value="ADMIN">Quản trị viên (Admin)</option>
              </select>
            </div>

            <div className="border-t border-divider-soft my-2 pt-4 flex flex-col gap-4">
              <p className="text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Cấu hình riêng cho Học viên</p>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Lớp học</label>
                <select
                  name="classId"
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                >
                  <option value="">— Chọn lớp —</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Phụ huynh đại diện</label>
                <select
                  name="parentId"
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                >
                  <option value="">— Chọn phụ huynh —</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>{p.user.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold transition-colors shadow-sm w-full mt-4 flex items-center justify-center gap-2 text-sm"
            >
              <UserPlus className="h-4 w-4" />
              Tạo tài khoản
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
