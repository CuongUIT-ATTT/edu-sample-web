"use client";

import React, { useTransition } from "react";
import { LogOut, RefreshCw } from "lucide-react";
import { logout } from "@/actions/auth";
import StitchIconBadge from "@/components/ui/stitch/StitchIconBadge";

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
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="flex items-center justify-start gap-3 px-2 md:px-4 py-2.5 rounded-md text-red-600 hover:bg-red-500/10 font-caption text-sm transition-all w-full text-left cursor-pointer disabled:opacity-50 apple-active-scale"
    >
      {isPending ? (
        <RefreshCw className="h-4 w-4 animate-spin flex-shrink-0 text-red-600" />
      ) : (
        <StitchIconBadge icon={LogOut} variant="red" size="sm" />
      )}
      <span>Đăng xuất</span>
    </button>
  );
}
