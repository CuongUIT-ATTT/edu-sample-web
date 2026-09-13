"use client";

import React, { ButtonHTMLAttributes } from "react";

interface StitchChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function StitchChip({
  selected = false,
  children,
  className = "",
  type = "button",
  ...props
}: StitchChipProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-caption text-xs rounded-pill px-4 py-2 motion-chip cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-focus select-none";

  const stateClasses = selected
    ? "bg-canvas border-2 border-primary-focus text-ink font-semibold shadow-xs"
    : "bg-canvas border border-hairline text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-normal";

  return (
    <button
      type={type}
      className={`${baseClasses} ${stateClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
