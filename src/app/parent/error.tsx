"use client";

import DashboardError from "@/components/DashboardError";

export default function ParentError({
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
      homeHref="/parent"
      roleName="Phụ huynh"
    />
  );
}
