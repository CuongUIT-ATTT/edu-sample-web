"use client";

import React, { ButtonHTMLAttributes } from "react";

export type StitchButtonVariant =
  | "primary" // Action Blue Pill (rounded-pill, bg-primary)
  | "secondary-pill" // Ghost Pill (rounded-pill, border-primary, text-primary)
  | "dark-utility" // Utility Dark (rounded-sm, bg-ink, text-white)
  | "pearl-capsule" // Pearl Capsule (rounded-md, bg-surface-pearl, border-divider-soft)
  | "store-hero"; // Store Hero Large Pill

interface StitchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: StitchButtonVariant;
  children: React.ReactNode;
  className?: string;
}

export function StitchButton({
  variant = "primary",
  children,
  className = "",
  type = "button",
  ...props
}: StitchButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-body motion-btn focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-1 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed select-none";

  let variantClasses = "";
  switch (variant) {
    case "primary":
      variantClasses =
        "bg-primary hover:bg-primary-focus text-white rounded-pill px-5 py-2.5 text-sm font-normal";
      break;
    case "secondary-pill":
      variantClasses =
        "bg-transparent border border-primary text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-pill px-5 py-2.5 text-sm font-normal";
      break;
    case "dark-utility":
      variantClasses =
        "bg-ink hover:bg-ink-muted-80 text-white rounded-sm px-4 py-2 text-xs font-normal";
      break;
    case "pearl-capsule":
      variantClasses =
        "bg-surface-pearl hover:bg-canvas-parchment text-ink-muted-80 border border-divider-soft rounded-md px-3.5 py-2 text-xs font-semibold";
      break;
    case "store-hero":
      variantClasses =
        "bg-primary hover:bg-primary-focus text-white rounded-pill px-7 py-3.5 text-lg font-light";
      break;
  }

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
