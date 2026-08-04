"use client";

import React, { useState } from "react";
import { updateProfileSettings } from "@/actions/settings";
import { User, Shield, GraduationCap, Users2, Key, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

interface SettingsFormProps {
  user: {
    name: string;
    email: string;
    role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
  };
  backUrl: string;
}

export default function SettingsForm({ user, backUrl }: SettingsFormProps) {
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="h-5 w-5 text-red-600" />;
      case "TEACHER":
        return <User className="h-5 w-5 text-green-600" />;
      case "STUDENT":
        return <GraduationCap className="h-5 w-5 text-blue-600" />;
      case "PARENT":
        return <Users2 className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: "Quản trị viên",
      TEACHER: "Giảng viên",
      STUDENT: "Học viên",
      PARENT: "Phụ huynh",
    };
    return labels[role] || role;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("currentPassword", currentPassword);
    formData.append("newPassword", newPassword);

    const res = await updateProfileSettings(formData);
    setLoading(false);

    if (res.success) {
      setMessage(res.message || "Cập nhật thành công.");
      setCurrentPassword("");
      setNewPassword("");
    } else {
      setError(res.error || "Đã xảy ra lỗi.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">Thiết lập tài khoản</h1>
        <p className="font-caption text-ink-muted-80 mt-1">Cấu hình hồ sơ cá nhân và thay đổi mật khẩu đăng nhập</p>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center gap-3 text-sm font-body">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center gap-3 text-sm font-body">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-canvas border border-hairline rounded-lg shadow-sm divide-y divide-hairline">
        {/* Profile Card */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary-muted-12 text-primary flex items-center justify-center flex-shrink-0">
              {getRoleIcon(user.role)}
            </div>
            <div>
              <p className="font-body-strong text-base font-semibold text-ink">{user.name}</p>
              <p className="text-xs font-caption text-ink-muted-48 mt-0.5">{user.email}</p>
            </div>
          </div>
          <span className="text-xs font-caption bg-surface-pearl border border-divider-soft text-ink-muted-80 px-3 py-1 rounded-full self-start sm:self-center">
            Vai trò: {getRoleLabel(user.role)}
          </span>
        </div>

        {/* Edit Fields Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-caption-strong text-ink-muted-80">Họ và tên hiển thị</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-11 text-sm text-ink outline-none focus:border-primary-focus w-full"
              required
            />
          </div>

          <div className="border-t border-divider-soft pt-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-caption-strong text-ink-muted-48 uppercase tracking-wider">
              <Key className="h-4 w-4 text-primary" />
              Đổi mật khẩu tài khoản
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-caption-strong text-ink-muted-80">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 cursor-pointer text-ink-muted-48 hover:text-primary transition-colors"
                    aria-label={showCurrent ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-caption-strong text-ink-muted-80">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 cursor-pointer text-ink-muted-48 hover:text-primary transition-colors"
                    aria-label={showNew ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold transition-all disabled:opacity-50 shadow-sm w-full mt-4 flex items-center justify-center gap-2 text-sm"
          >
            Lưu các thay đổi
          </button>
        </form>
      </div>
    </div>
  );
}
