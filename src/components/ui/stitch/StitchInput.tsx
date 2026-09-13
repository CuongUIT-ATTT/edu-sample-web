"use client";

import React, { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";

export type StitchInputVariant = "search" | "standard";

interface StitchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: StitchInputVariant;
  className?: string;
}

export function StitchInput({
  variant = "standard",
  className = "",
  ...props
}: StitchInputProps) {
  if (variant === "search") {
    return (
      <div className="relative flex items-center w-full group">
        <Search className="absolute left-4 h-4 w-4 text-ink-muted-48 pointer-events-none transition-colors duration-200 group-focus-within:text-primary" />
        <input
          type="text"
          className={`w-full bg-canvas border border-hairline text-ink font-body text-sm rounded-pill pl-11 pr-5 py-2.5 h-11 placeholder:text-ink-muted-48 focus:outline-none focus:ring-2 focus:ring-primary-focus focus:border-transparent transition-all duration-200 ease-out focus:scale-[1.005] ${className}`}
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      className={`w-full bg-canvas border border-hairline text-ink font-body text-sm rounded-sm px-4 py-2.5 h-11 placeholder:text-ink-muted-48 focus:outline-none focus:ring-2 focus:ring-primary-focus focus:border-transparent transition-all duration-200 ease-out focus:scale-[1.005] ${className}`}
      {...props}
    />
  );
}
