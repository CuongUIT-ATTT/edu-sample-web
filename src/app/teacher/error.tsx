"use client";

import DashboardError from "@/components/DashboardError";

export default function TeacherError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <DashboardError
      error={error}
      reset={reset}
      homeHref="/teacher"
      roleName="Giảng viên"
    />
  );
}
