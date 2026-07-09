"use client";

import React, { useTransition } from "react";
import { LogOut, RefreshCw } from "lucide-react";
import { logout } from "@/actions/auth";

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      const res = await logout();
      if (res.success) {
        window.location.href = "/login";
      }
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="flex items-center gap-3 px-4 py-2.5 rounded-sm text-red-600 hover:bg-red-50 font-caption text-sm transition-colors w-full text-left cursor-pointer disabled:opacity-50"
    >
      {isPending ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      Đăng xuất
    </button>
  );
}
