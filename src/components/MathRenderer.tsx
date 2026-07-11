"use client";

import React from "react";
import katex from "katex";

interface MathRendererProps {
  text: string;
  className?: string;
}

export default function MathRenderer({ text, className = "" }: MathRendererProps) {
  if (!text) return null;

  // Split string by "$" to find math blocks
  const parts = text.split("$");

  if (parts.length === 1) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Even indices are plain text, odd indices are math formulas
        if (index % 2 === 0) {
          return <span key={index}>{part}</span>;
        } else {
          try {
            const html = katex.renderToString(part, {
              throwOnError: false,
              displayMode: false,
            });
            return (
              <span
                key={index}
                className="inline-block mx-1"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            console.error("KaTeX rendering error for formula:", part, e);
            return <span key={index} className="text-red-500 font-mono">${part}$</span>;
          }
        }
      })}
    </span>
  );
}
