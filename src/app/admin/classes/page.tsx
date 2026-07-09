import React from "react";
import { BookOpen, Calendar, Plus, Users, Award } from "lucide-react";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export default async function AdminClassesPage() {
  const classesList = await db.class.findMany({
    include: {
      formTeacher: {
        include: { user: true },
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left List */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <h1 className="font-tagline text-2xl font-semibold text-ink">Quản lý lớp học</h1>
          <p className="font-caption text-ink-muted-80 mt-1">Danh mục lớp học và giáo viên chủ nhiệm tương ứng</p>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-hairline bg-surface-pearl flex items-center justify-between">
            <h2 className="font-body-strong text-sm text-ink flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Tổng cộng ({classesList.length} lớp học)
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-hairline bg-surface-pearl">
                <th className="text-left px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Tên lớp</th>
                <th className="text-center px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Khối</th>
                <th className="text-center px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Sĩ số</th>
                <th className="text-left px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Giáo viên chủ nhiệm</th>
              </tr>
            </thead>
            <tbody>
              {classesList.map((c) => (
                <tr key={c.id} className="border-b border-hairline last:border-0 hover:bg-surface-pearl transition-colors">
                  <td className="px-6 py-4 text-sm font-body-strong text-ink">{c.name}</td>
                  <td className="px-6 py-4 text-center text-sm font-caption text-ink-muted-80">Lớp {c.gradeLevel}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-caption bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {c._count.students} Học sinh
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-caption text-ink-muted-80">
                    {c.formTeacher?.user.name || "Chưa có"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-tagline text-lg font-semibold text-ink">Tạo lớp mới</h2>
          <p className="font-caption text-ink-muted-80 mt-1">Thêm lớp học vào cơ sở dữ liệu</p>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm">
          <form action={handleCreateClass} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Tên lớp học</label>
              <input
                type="text"
                name="name"
                placeholder="10A1, 11B2..."
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Khối lớp</label>
              <select
                name="gradeLevel"
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                required
              >
                <option value="10">Khối 10 (Grade 10)</option>
                <option value="11">Khối 11 (Grade 11)</option>
                <option value="12">Khối 12 (Grade 12)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Giáo viên chủ nhiệm</label>
              <select
                name="formTeacherId"
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
              >
                <option value="">— Chọn giáo viên —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.user.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold transition-colors shadow-sm w-full mt-4 flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Tạo lớp học
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
