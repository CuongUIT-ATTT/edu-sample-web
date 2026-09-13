"use client";

import React from "react";

export interface EduWebLogoProps {
  variant?: "full" | "compact" | "icon-only" | "badge";
  size?: "sm" | "md" | "lg" | "xl";
  theme?: "light" | "dark" | "auto";
  className?: string;
  showSubtitle?: boolean;
}

export function EduWebLogoIcon({
  className = "w-8 h-8",
  size = 32,
  title = "EduWeb",
  decorative = false,
}: {
  className?: string;
  size?: number;
  title?: string;
  decorative?: boolean;
}) {
  const idPrefix = React.useId().replace(/:/g, "");
  const gradientId = `eduweb-bg-${idPrefix}`;
  const goldId = `eduweb-gold-${idPrefix}`;
  const shadowId = `eduweb-shadow-${idPrefix}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden={decorative ? "true" : undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="512"
          y2="512"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="50%" stopColor="#0066cc" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        <linearGradient
          id={goldId}
          x1="220"
          y1="120"
          x2="380"
          y2="280"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>

        <filter
          id={shadowId}
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          filterUnits="userSpaceOnUse"
        >
          <feDropShadow
            dx="0"
            dy="8"
            stdDeviation="12"
            floodColor="#0066cc"
            floodOpacity="0.3"
          />
        </filter>
      </defs>

      {/* Squircle Badge */}
      <rect
        x="16"
        y="16"
        width="480"
        height="480"
        rx="108"
        fill={`url(#${gradientId})`}
        filter={`url(#${shadowId})`}
      />

      {/* Subtle shine overlay */}
      <rect
        x="16"
        y="16"
        width="480"
        height="240"
        rx="108"
        fill="white"
        fillOpacity="0.08"
      />

      {/* Open Book Wings (Left & Right) */}
      <path
        d="M112 336C160 312 216 320 256 344C296 320 352 312 400 336V208C352 184 296 192 256 216C216 192 160 184 112 208V336Z"
        fill="white"
        fillOpacity="0.22"
      />
      <path
        d="M128 348C172 328 220 334 256 356C292 334 340 328 384 348V228C340 208 292 214 256 236C220 214 172 208 128 228V348Z"
        fill="white"
        fillOpacity="0.9"
      />

      {/* Graduation Cap Diamond */}
      <path
        d="M256 112L392 180L256 248L120 180L256 112Z"
        fill="white"
      />

      {/* Cap Base Ring & Academic Crest Pillar */}
      <path
        d="M176 212V244C176 270 212 292 256 292C300 292 336 270 336 244V212L256 252L176 212Z"
        fill={`url(#${goldId})`}
      />

      {/* Golden Intellect Spark & Tassel */}
      <path
        d="M364 196L368 296C368 312 356 324 340 324C324 324 312 312 312 296"
        stroke={`url(#${goldId})`}
        strokeWidth="16"
        strokeLinecap="round"
      />
      <circle cx="368" cy="296" r="14" fill="#fde047" />

      {/* Center Star / Digital Node */}
      <polygon
        points="256,140 264,164 288,164 268,178 276,202 256,188 236,202 244,178 224,164 248,164"
        fill="#0066cc"
      />
    </svg>
  );
}

export function EduWebLogo({
  variant = "full",
  size = "md",
  theme = "auto",
  className = "",
  showSubtitle = true,
}: EduWebLogoProps) {
  // Dimensions based on size prop
  let iconSize = 36;
  let textSize = "text-xl";
  let subtitleSize = "text-[10px]";
  let gapClass = "gap-2.5";

  switch (size) {
    case "sm":
      iconSize = 26;
      textSize = "text-base";
      subtitleSize = "text-[9px]";
      gapClass = "gap-2";
      break;
    case "md":
      iconSize = 36;
      textSize = "text-xl";
      subtitleSize = "text-[10px]";
      gapClass = "gap-2.5";
      break;
    case "lg":
      iconSize = 44;
      textSize = "text-2xl";
      subtitleSize = "text-xs";
      gapClass = "gap-3";
      break;
    case "xl":
      iconSize = 56;
      textSize = "text-3xl";
      subtitleSize = "text-xs";
      gapClass = "gap-3.5";
      break;
  }

  // Theme text colors
  const eduTextColor =
    theme === "dark"
      ? "text-white"
      : theme === "light"
      ? "text-ink"
      : "text-ink dark:text-white";

  const subTextColor =
    theme === "dark"
      ? "text-slate-400"
      : theme === "light"
      ? "text-ink-muted-80"
      : "text-ink-muted-80 dark:text-slate-400";

  if (variant === "icon-only") {
    return <EduWebLogoIcon size={iconSize} className={className} />;
  }

  return (
    <div className={`inline-flex items-center ${gapClass} ${className}`}>
      <EduWebLogoIcon size={iconSize} decorative />

      {variant !== "compact" && (
        <div className="flex flex-col leading-none select-none">
          <div className="flex items-center tracking-tight font-display font-bold">
            <span className={`${textSize} ${eduTextColor}`}>Edu</span>
            <span
              className={`${textSize} bg-gradient-to-r from-primary via-primary-focus to-sky-500 bg-clip-text text-transparent ml-0.5`}
            >
              Web
            </span>
          </div>

          {showSubtitle && (
            <span
              className={`${subtitleSize} font-medium ${subTextColor} uppercase tracking-wider mt-0.5 flex items-center gap-1`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Khảo Thí & LMS
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default EduWebLogo;
