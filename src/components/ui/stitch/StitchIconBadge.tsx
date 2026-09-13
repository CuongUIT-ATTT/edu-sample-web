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
  blue: "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/30 dark:from-blue-500 dark:to-blue-600 dark:shadow-blue-500/40 ring-1 ring-white/25",
  indigo:
    "bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/30 dark:from-indigo-500 dark:to-indigo-600 dark:shadow-indigo-500/40 ring-1 ring-white/25",
  purple:
    "bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white shadow-md shadow-purple-500/30 dark:from-purple-500 dark:to-purple-600 dark:shadow-purple-500/40 ring-1 ring-white/25",
  emerald:
    "bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-500/30 dark:from-emerald-500 dark:to-emerald-600 dark:shadow-emerald-500/40 ring-1 ring-white/25",
  amber:
    "bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/30 dark:from-amber-400 dark:to-amber-600 dark:shadow-amber-500/40 ring-1 ring-white/25",
  rose: "bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 text-white shadow-md shadow-rose-500/30 dark:from-rose-500 dark:to-rose-600 dark:shadow-rose-500/40 ring-1 ring-white/25",
  teal: "bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/30 dark:from-teal-400 dark:to-teal-600 dark:shadow-teal-500/40 ring-1 ring-white/25",
  cyan: "bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600 text-white shadow-md shadow-cyan-500/30 dark:from-cyan-400 dark:to-cyan-600 dark:shadow-cyan-500/40 ring-1 ring-white/25",
  slate:
    "bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 text-white shadow-md shadow-slate-500/30 dark:from-slate-500 dark:to-slate-600 dark:shadow-slate-500/40 ring-1 ring-white/25",
  red: "bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white shadow-md shadow-red-500/30 dark:from-red-500 dark:to-red-600 dark:shadow-red-500/40 ring-1 ring-white/25",
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
    container: "h-8 w-8 rounded-lg md:rounded-xl",
    icon: "h-4.5 w-4.5",
  },
  md: {
    container: "h-10 w-10 rounded-xl",
    icon: "h-5 w-5",
  },
  lg: {
    container: "h-12 w-12 rounded-2xl",
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
    ? "ring-2 ring-white/90 dark:ring-white/80 shadow-lg scale-105"
    : "";

  const Icon = IconComponent as React.ComponentType<{ className?: string }>;

  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center flex-shrink-0 transition-all duration-200 ${currentSize.container} ${currentVariant} ${activeStyles} ${className}`}
    >
      {React.isValidElement(IconComponent) ? (
        IconComponent
      ) : IconComponent ? (
        <Icon className={`${currentSize.icon} text-white drop-shadow-xs`} />
      ) : null}
    </span>
  );
}

export default StitchIconBadge;
