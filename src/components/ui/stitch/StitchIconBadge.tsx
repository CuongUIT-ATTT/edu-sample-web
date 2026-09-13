"use client";

import React from "react";

export type StitchIconBadgeVariant =
  | "blue"
  | "indigo"
  | "purple"
  | "emerald"
  | "amber"
  | "rose"
  | "teal"
  | "cyan"
  | "slate"
  | "red";

export type StitchIconBadgeSize = "xs" | "sm" | "md" | "lg";

export interface StitchIconBadgeProps {
  icon: React.ComponentType<{ className?: string }> | React.ReactNode;
  variant?: StitchIconBadgeVariant;
  size?: StitchIconBadgeSize;
  isActive?: boolean;
  className?: string;
}

const variantStyles: Record<StitchIconBadgeVariant, string> = {
  blue: "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-xs shadow-blue-500/20 dark:from-blue-600 dark:to-blue-700",
  indigo:
    "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-xs shadow-indigo-500/20 dark:from-indigo-600 dark:to-indigo-700",
  purple:
    "bg-gradient-to-b from-purple-500 to-purple-600 text-white shadow-xs shadow-purple-500/20 dark:from-purple-600 dark:to-purple-700",
  emerald:
    "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-xs shadow-emerald-500/20 dark:from-emerald-600 dark:to-emerald-700",
  amber:
    "bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-xs shadow-amber-500/20 dark:from-amber-600 dark:to-amber-700",
  rose: "bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-xs shadow-rose-500/20 dark:from-rose-600 dark:to-rose-700",
  teal: "bg-gradient-to-b from-teal-500 to-teal-600 text-white shadow-xs shadow-teal-500/20 dark:from-teal-600 dark:to-teal-700",
  cyan: "bg-gradient-to-b from-cyan-500 to-cyan-600 text-white shadow-xs shadow-cyan-500/20 dark:from-cyan-600 dark:to-cyan-700",
  slate:
    "bg-gradient-to-b from-slate-600 to-slate-700 text-white shadow-xs shadow-slate-600/20 dark:from-slate-700 dark:to-slate-800",
  red: "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-xs shadow-red-500/20 dark:from-red-600 dark:to-red-700",
};

const sizeStyles: Record<
  StitchIconBadgeSize,
  { container: string; icon: string }
> = {
  xs: {
    container: "h-6 w-6 rounded-md",
    icon: "h-3.5 w-3.5",
  },
  sm: {
    container: "h-7 w-7 rounded-md",
    icon: "h-4 w-4",
  },
  md: {
    container: "h-9 w-9 rounded-lg",
    icon: "h-5 w-5",
  },
  lg: {
    container: "h-11 w-11 rounded-lg",
    icon: "h-6 w-6",
  },
};

export function StitchIconBadge({
  icon: IconComponent,
  variant = "blue",
  size = "sm",
  isActive = false,
  className = "",
}: StitchIconBadgeProps) {
  const currentSize = sizeStyles[size];
  const currentVariant = variantStyles[variant];

  const activeStyles = isActive
    ? "ring-2 ring-primary/40 shadow-md scale-[1.04]"
    : "";

  return (
    <span
      className={`inline-flex items-center justify-center flex-shrink-0 transition-all duration-200 border border-black/10 dark:border-white/15 ${currentSize.container} ${currentVariant} ${activeStyles} ${className}`}
    >
      {React.isValidElement(IconComponent) ? (
        IconComponent
      ) : typeof IconComponent === "function" ||
        typeof IconComponent === "object" ? (
        // @ts-expect-error IconComponent can be a Lucide React component
        <IconComponent className={currentSize.icon} />
      ) : null}
    </span>
  );
}

export default StitchIconBadge;
