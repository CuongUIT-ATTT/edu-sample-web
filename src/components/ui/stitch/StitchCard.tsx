"use client";

import React, { HTMLAttributes } from "react";

export type StitchCardVariant =
  | "utility" // 18px rounded, white background, hairline border (store utility card)
  | "parchment" // 18px rounded, parchment background
  | "dark-tile" // Near-black tile background, white text
  | "pearl"; // Pearl surface background

interface StitchCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: StitchCardVariant;
  hasProductShadow?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function StitchCard({
  variant = "utility",
  hasProductShadow = false,
  children,
  className = "",
  ...props
}: StitchCardProps) {
  let variantClasses = "";
  switch (variant) {
    case "utility":
      variantClasses = "bg-canvas border border-hairline text-ink rounded-lg p-6";
      break;
    case "parchment":
      variantClasses = "bg-canvas-parchment border border-hairline text-ink rounded-lg p-6";
      break;
    case "dark-tile":
      variantClasses = "bg-surface-tile-1 text-white rounded-lg p-6 border border-surface-tile-2";
      break;
    case "pearl":
      variantClasses = "bg-surface-pearl border border-divider-soft text-ink rounded-lg p-6";
      break;
  }

  const shadowClass = hasProductShadow ? "shadow-product" : "";

  return (
    <div className={`${variantClasses} ${shadowClass} ${className}`} {...props}>
      {children}
    </div>
  );
}
