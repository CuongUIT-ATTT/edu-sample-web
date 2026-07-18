/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, UserPlus, Shield, User, GraduationCap, Users2, 
  Trash2, Edit3, Search, Filter, CheckSquare, Square, 
  Upload, FileSpreadsheet, X, HelpCircle, CheckCircle, AlertCircle
} from "lucide-react";
import { createUser, updateUser, deleteUser, bulkDeleteUsers, importUsers } from "@/actions/users";
import Link from "next/link";

interface DbUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
  studentProfile?: {
    classes?: { id: string; name: string }[] | null;
  } | null;
}

interface UserManagementTableProps {
  users: DbUser[];
  classes: { id: string; name: string }[];
  parents: { id: string; user: { name: string } }[];
}

export default function UserManagementTable({ users, classes, parents }: UserManagementTableProps) {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal / Form States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DbUser | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Status message states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // CSV Import states
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);

  // Form input states (for Create/Edit)
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<"ADMIN" | "TEACHER" | "STUDENT" | "PARENT">("STUDENT");
  const [formPassword, setFormPassword] = useState("");
  const [formClassIds, setFormClassIds] = useState<string[]>([]);
  const [formParentId, setFormParentId] = useState("");

  const downloadUserCsvTemplate = () => {
    const headers = "Name,Email,Password,Role,Class\n";
    const sampleRow = "\"Nguyen Van A\",\"student_a@eduweb.vn\",\"Password@2026\",\"STUDENT\",\"10A1\"\n\"Tran Thi B\",\"teacher_b@eduweb.vn\",\"Password@2026\",\"TEACHER\",\"\"\n";
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + sampleRow);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "mau_danh_sach_nguoi_dung.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRoleIcon = (role: string) => {
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

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: "Admin",
      TEACHER: "Giảng viên",
      STUDENT: "Học viên",
      PARENT: "Phụ huynh",
    };
    return labels[role] || role;
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = selectedRole === "ALL" || u.role === selectedRole;
      
      const matchesClass = 
        selectedClassId === "ALL" || 
        (u.role === "STUDENT" && u.studentProfile?.classes?.some((c: any) => c.id === selectedClassId));

      return matchesSearch && matchesRole && matchesClass;
    });
  }, [users, searchTerm, selectedRole, selectedClassId]);

  // Handle individual checkbox selection
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Handle all checkbox selection
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn xoá ${selectedIds.size} tài khoản đã chọn không?`)) return;

    const ids = Array.from(selectedIds);
    const res = await bulkDeleteUsers(ids);
    if (res.success) {
      setSuccessMsg(`Đã xoá thành công ${ids.length} tài khoản.`);
      setSelectedIds(new Set());
    } else {
      setErrorMsg(res.error || "Có lỗi xảy ra khi xoá hàng loạt.");
    }
  };

  const openCreateModal = () => {
    setFormName("");
    setFormEmail("");
    setFormRole("STUDENT");
    setFormPassword("");
    setFormClassIds([]);
    setFormParentId("");
    setIsCreateOpen(true);
  };

  const openEditModal = (u: DbUser) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormPassword("");
    // Prefill all classes if available
    setFormClassIds(u.studentProfile?.classes?.map((c: any) => c.id) || []);
    setIsCreateOpen(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await createUser({
      name: formName,
      email: formEmail,
      role: formRole,
      password: formPassword || undefined,
      classIds: formRole === "STUDENT" ? formClassIds : undefined,
      parentId: formRole === "STUDENT" ? formParentId || undefined : undefined,
    });

    if (res.success) {
      setSuccessMsg(`Tạo tài khoản ${formName} thành công.`);
      setIsCreateOpen(false);
    } else {
      setErrorMsg(res.error || "Tạo tài khoản thất bại.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    const res = await updateUser(editingUser.id, {
      name: formName,
      email: formEmail,
      role: formRole,
      password: formPassword || undefined,
      classIds: formRole === "STUDENT" ? formClassIds : undefined,
      parentId: formRole === "STUDENT" ? formParentId || undefined : undefined,
    });

    if (res.success) {
      setSuccessMsg(`Cập nhật tài khoản ${formName} thành công.`);
      setEditingUser(null);
    } else {
      setErrorMsg(res.error || "Cập nhật tài khoản thất bại.");
    }
  };

  const handleDeleteIndividual = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xoá tài khoản ${name}?`)) return;
    const res = await deleteUser(id);
    if (res.success) {
      setSuccessMsg(`Xoá tài khoản ${name} thành công.`);
    } else {
      setErrorMsg(res.error || "Xoá tài khoản thất bại.");
    }
  };

  // CSV Parsing Logic
  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split("\n").map((r) => r.trim()).filter((r) => r.length > 0);
      if (rows.length < 2) return;

      const parsed: any[] = [];
      const headers = rows[0].split(",").map((h) => h.trim().toLowerCase());
      
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(",").map((c) => c.trim());
        const rowData: any = {};
        headers.forEach((h, index) => {
          rowData[h] = cols[index] || "";
        });
        parsed.push(rowData);
      }
      setParsedPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (parsedPreview.length === 0) return;
    
    // Map parsed data fields to expected server inputs
    const mapped = parsedPreview.map((row) => ({
      name: row.name || row.ten || "",
      email: row.email || "",
      password: row.password || row.matkhau || "Password@2026",
      role: (row.role || row.vaitro || "STUDENT").toUpperCase() as any,
      classId: row.class || row.lop || undefined, // Class Name here, backend transaction will search id
    }));

    const res = await importUsers(mapped);
    if (res.success) {
      setSuccessMsg(`Nhập học viên thành công! Đã thêm: ${res.successCount}, Thất bại/Trùng: ${res.failCount}`);
      setIsImportOpen(false);
      setParsedPreview([]);
      setCsvFile(null);
    } else {
      setErrorMsg(res.error || "Nhập danh sách học viên thất bại.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Alert Notices */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}><X className="h-4 w-4" /></button>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Action Header & Filtering */}
      <div className="bg-canvas border border-hairline rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 border border-hairline rounded-pill px-4 py-2 bg-surface-pearl w-full md:max-w-xs">
          <Search className="h-4 w-4 text-ink-muted-48" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, email..."
            className="bg-transparent text-sm text-ink outline-none w-full"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-ink-muted-80">
            <Filter className="h-3.5 w-3.5" />
            <span>Vai trò:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-canvas border border-hairline rounded px-2.5 py-1 text-xs"
            >
              <option value="ALL">Tất cả</option>
              <option value="ADMIN">Admin</option>
              <option value="TEACHER">Giảng viên</option>
              <option value="STUDENT">Học viên</option>
              <option value="PARENT">Phụ huynh</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-ink-muted-80">
            <span>Lớp học:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-canvas border border-hairline rounded px-2.5 py-1 text-xs"
            >
              <option value="ALL">Tất cả lớp</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsImportOpen(true)}
            className="border border-primary text-primary hover:bg-blue-50 px-4 py-1.5 rounded-pill text-xs font-semibold flex items-center gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" /> Import Excel/CSV
          </button>

          <button
            onClick={openCreateModal}
            className="bg-primary hover:bg-primary-focus text-white px-4 py-1.5 rounded-pill text-xs font-semibold flex items-center gap-1.5"
          >
            <UserPlus className="h-3.5 w-3.5" /> Thêm tài khoản
          </button>
        </div>
      </div>

      {/* Bulk action ribbon */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-3 flex items-center justify-between animate-fade-in">
          <span className="text-xs text-ink font-semibold">
            Đang chọn <strong className="text-primary">{selectedIds.size}</strong> tài khoản
          </span>
          <button
            onClick={handleBulkDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-pill text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Trash2 className="h-3.5 w-3.5" /> Xoá các mục đã chọn
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-canvas border border-hairline rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline bg-surface-pearl">
              <th className="w-12 px-6 py-4 text-left">
                <button onClick={toggleSelectAll}>
                  {selectedIds.size === filteredUsers.length && filteredUsers.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-ink-muted-48" />
                  )}
                </button>
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Họ và tên / Email</th>
              <th className="text-center px-6 py-4 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Vai trò</th>
              <th className="text-left px-6 py-4 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Chi tiết / Phân lớp</th>
              <th className="text-center px-6 py-4 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center font-body text-ink-muted-80">
                  Không tìm thấy tài khoản nào khớp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-surface-pearl transition-colors">
                  <td className="px-6 py-4">
                    <button onClick={() => toggleSelect(user.id)}>
                      {selectedIds.has(user.id) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-ink-muted-48" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-body-strong text-ink">{user.name}</p>
                    <p className="text-xs font-caption text-ink-muted-48 mt-0.5">{user.email}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 text-xs font-caption bg-surface-pearl border border-divider-soft text-ink-muted-80 px-2.5 py-1 rounded-full">
                      {getRoleIcon(user.role)}
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-caption text-ink-muted-80">
                    {user.role === "STUDENT" ? (
                      user.studentProfile?.classes && user.studentProfile.classes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.studentProfile.classes.map((c) => (
                            <span key={c.id} className="text-xs font-body bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                              Lớp {c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs italic text-ink-muted-48">Chưa xếp lớp</span>
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-primary hover:bg-blue-50 p-2 rounded-full transition-colors"
                        title="Chỉnh sửa tài khoản (U)"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteIndividual(user.id, user.name)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                        title="Xoá tài khoản (D)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE & EDIT MODAL */}
      {(isCreateOpen || editingUser) && (
        <div className="fixed inset-0 bg-ink-muted-48 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-lg w-[500px] max-w-full shadow-product flex flex-col overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-hairline bg-surface-pearl flex items-center justify-between">
              <h3 className="font-tagline text-base font-semibold text-ink">
                {editingUser ? `Chỉnh sửa tài khoản: ${editingUser.name}` : "Tạo tài khoản mới"}
              </h3>
              <button 
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingUser(null);
                }} 
                className="text-ink-muted-48 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={editingUser ? handleEditSubmit : handleCreateSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Họ và tên</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="example@eduweb.vn"
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">
                  {editingUser ? "Mật khẩu mới (bỏ trống nếu giữ nguyên)" : "Mật khẩu khởi tạo"}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingUser ? "••••••••" : "Mặc định: Password@2026"}
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Vai trò</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                  required
                >
                  <option value="STUDENT">Học viên (Student)</option>
                  <option value="TEACHER">Giảng viên (Teacher)</option>
                  <option value="PARENT">Phụ huynh (Parent)</option>
                  <option value="ADMIN">Quản trị viên (Admin)</option>
                </select>
              </div>

              {formRole === "STUDENT" && (
                <div className="border-t border-divider-soft mt-2 pt-4 flex flex-col gap-3">
                  <p className="text-[10px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Cấu hình riêng cho Học viên</p>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-caption-strong text-ink-muted-80">Lớp học <span className="text-ink-muted-48">(chọn nhiều)</span></label>
                    <div className="border border-hairline rounded-lg overflow-y-auto max-h-36 divide-y divide-hairline">
                      {classes.length === 0 ? (
                        <p className="text-xs text-ink-muted-48 p-3">Chưa có lớp nào.</p>
                      ) : (
                        classes.map((c) => (
                          <label
                            key={c.id}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-surface-pearl cursor-pointer text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={formClassIds.includes(c.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormClassIds((prev) => [...prev, c.id]);
                                } else {
                                  setFormClassIds((prev) => prev.filter((id) => id !== c.id));
                                }
                              }}
                              className="h-4 w-4 accent-primary rounded"
                            />
                            <span className="text-ink">{c.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                    {formClassIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {formClassIds.map((id) => {
                          const cls = classes.find((c) => c.id === id);
                          return cls ? (
                            <span key={id} className="text-[10px] bg-blue-50 text-primary border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                              {cls.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-caption-strong text-ink-muted-80">Phụ huynh đại diện</label>
                    <select
                      value={formParentId}
                      onChange={(e) => setFormParentId(e.target.value)}
                      className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                    >
                      <option value="">— Chọn phụ huynh —</option>
                      {parents.map((p) => (
                        <option key={p.id} value={p.id}>{p.user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold transition-colors w-full mt-4 text-sm"
              >
                {editingUser ? "Lưu thay đổi" : "Tạo tài khoản"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT EXCEL/CSV MODAL */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-ink-muted-48 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-lg w-[550px] max-w-full shadow-product flex flex-col overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-hairline bg-surface-pearl flex items-center justify-between">
              <h3 className="font-tagline text-base font-semibold text-ink flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                Nhập danh sách bằng file Excel/CSV
              </h3>
              <button 
                onClick={() => {
                  setIsImportOpen(false);
                  setParsedPreview([]);
                  setCsvFile(null);
                }} 
                className="text-ink-muted-48 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
              {/* Template Download Alert */}
              <div className="flex justify-between items-center bg-blue-50 border border-blue-200 p-3.5 rounded-lg text-xs">
                <span className="font-semibold text-blue-800">Tải xuống file dữ liệu mẫu học viên:</span>
                <button
                  type="button"
                  onClick={downloadUserCsvTemplate}
                  className="text-primary hover:underline font-bold"
                >
                  Tải file CSV mẫu (.csv)
                </button>
              </div>

              {/* File dropzone / upload */}
              <div className="border-2 border-dashed border-divider rounded-lg p-8 text-center flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors cursor-pointer bg-surface-pearl relative">
                <Upload className="h-10 w-10 text-ink-muted-48" />
                <p className="text-xs font-body-strong text-ink font-semibold">Tải lên file dữ liệu (.csv)</p>
                <p className="text-[10px] text-ink-muted-48">Mẫu cột: Name, Email, Password, Role, Class</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              {/* Preview parsed data */}
              {parsedPreview.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-caption-strong text-ink uppercase tracking-wider">Xem trước dữ liệu ({parsedPreview.length} học viên/người dùng)</h4>
                  <div className="border border-hairline rounded overflow-y-auto max-h-40 text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-surface-pearl border-b border-hairline">
                          <th className="p-2">Tên</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Vai trò</th>
                          <th className="p-2">Lớp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedPreview.slice(0, 10).map((row, i) => (
                          <tr key={i} className="border-b border-hairline last:border-0">
                            <td className="p-2">{row.name || row.ten}</td>
                            <td className="p-2">{row.email}</td>
                            <td className="p-2">{row.role || row.vaitro || "STUDENT"}</td>
                            <td className="p-2">{row.class || row.lop || "Chưa xếp"}</td>
                          </tr>
                        ))}
                        {parsedPreview.length > 10 && (
                          <tr>
                            <td colSpan={4} className="p-2 text-center text-ink-muted-48 italic">
                              ... và {parsedPreview.length - 10} dòng khác.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={handleImportSubmit}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-pill font-body font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors mt-2"
                  >
                    Xác nhận nhập dữ liệu <CheckCircle className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
