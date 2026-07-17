"use client";

import React from "react";
import katex from "katex";

interface MathRendererProps {
  text: string;
  className?: string;
}

/**
 * Render a single segment of text that may contain LaTeX math ($...$).
 * Returns an array of React nodes (plain spans + KaTeX spans).
 */
function renderMathSegment(segment: string, baseKey: string): React.ReactNode {
  if (!segment) return null;
  const parts = segment.split("$");
  if (parts.length === 1) {
    return <span key={baseKey}>{segment}</span>;
  }
  return (
    <span key={baseKey}>
      {parts.map((part, index) => {
        if (index % 2 === 0) {
          return <span key={`${baseKey}-t${index}`}>{part}</span>;
        } else {
          try {
            const html = katex.renderToString(part, {
              throwOnError: false,
              displayMode: false,
            });
            return (
              <span
                key={`${baseKey}-m${index}`}
                className="inline-block mx-0.5"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return (
              <span key={`${baseKey}-m${index}`} className="text-red-500 font-mono">
                ${part}$
              </span>
            );
          }
        }
      })}
    </span>
  );
}

/**
 * Detect whether a line is a list item and return its kind:
 *   "step"   — "- Bước 1:", "- Giai đoạn 2:", "- Step 3:"
 *   "alpha"  — "(a)", "(b)", ... or "a)", "b)"
 *   "roman"  — "(i)", "(ii)", ...
 *   "dash"   — any other "- ..." line
 *   "label"  — "Bước 1:", "Giai đoạn X:", "Phần I:", at line start
 *   null     — plain text
 */
type LineKind = "step" | "alpha" | "dash" | "label" | "note" | null;

function detectLineKind(line: string): LineKind {
  const trimmed = line.trimStart();
  // Step labels: "- Bước 1:", "- Step 2:"
  if (/^-\s*(B[uư][ớo]c|Step|Giai đo[aạ]n|Ph[aầ]n)\s*\d+/i.test(trimmed)) return "step";
  // Alphabetical options: "(a)", "(b)", "a)", "(A)"
  if (/^\([a-zA-Z]\)/.test(trimmed) || /^[a-zA-Z]\)/.test(trimmed)) return "alpha";
  // Dash list item
  if (/^-\s/.test(trimmed)) return "dash";
  // Bold label at start: "Bước 1:", "Cho biết:"
  if (/^(B[uư][ớo]c|Step|Giai đo[aạ]n|Ph[aầ]n|Cho bi[eế]t|L[uư]u ý|Ghi ch[uú])\b.+:/i.test(trimmed)) return "label";
  // Note lines starting with "Lưu ý:", "Ghi chú:", "Chú ý:"
  if (/^(L[uư]u ý|Ghi ch[uú]|Ch[uú] ý)\s*:/i.test(trimmed)) return "note";
  return null;
}

/**
 * Split raw question text into structured lines.
 * Supports:
 *   • \n literal newlines (from JSON)
 *   • Pattern detection for " - Bước", " (a)", " (b)" inline
 *   • "Cho biết:", "Lưu ý:" breaks
 */
function splitIntoLines(text: string): string[] {
  // Normalize literal \n escape sequences that may come through as backslash-n
  let normalized = text.replace(/\\n/g, "\n");

  // Auto-inject newlines before known structural patterns if they appear inline
  // Insert newline before " - Bước", " - Step", " - Giai đoạn"
  normalized = normalized.replace(
    /\s(-\s*(?:B[uư][ớo]c|Step|Giai\s*đo[aạ]n|Ph[aầ]n)\s*\d+[:.)])/gi,
    "\n$1"
  );
  // Insert newline before "(a)", "(b)", ..., "(g)" if they appear inline (not at start of string)
  normalized = normalized.replace(/(?<!\n)\s(\([a-zA-Z]\))/g, "\n$1");
  // Insert newline before "Cho biết:", "Lưu ý:", "Ghi chú:" if inline
  normalized = normalized.replace(
    /(?<!\n)\s((?:Cho bi[eế]t|L[uư]u ý|Ghi ch[uú]|Ch[uú] ý)\s*:)/gi,
    "\n$1"
  );

  return normalized
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Main MathRenderer component.
 * Renders question text with:
 *   - LaTeX math ($...$)
 *   - Auto-detected list structure (steps, sub-items, notes)
 *   - Proper line breaks from \n or inline pattern detection
 */
export default function MathRenderer({ text, className = "" }: MathRendererProps) {
  if (!text) return null;

  const lines = splitIntoLines(text);

  // If single line, render inline as before (no extra DOM elements)
  if (lines.length === 1) {
    return <span className={className}>{renderMathSegment(text, "l0")}</span>;
  }

  return (
    <span className={`${className} flex flex-col gap-1.5`}>
      {lines.map((line, lineIndex) => {
        const kind = detectLineKind(line);

        if (kind === "step") {
          // "- Bước X: ..." → styled step row
          const content = line.replace(/^-\s*/, "");
          return (
            <span
              key={lineIndex}
              className="flex gap-2 items-start mt-1"
            >
              <span className="text-primary font-bold flex-shrink-0">▸</span>
              <span className="leading-relaxed">
                {renderMathSegment(content, `l${lineIndex}`)}
              </span>
            </span>
          );
        }

        if (kind === "alpha") {
          // "(a) ...", "(b) ..." → indented sub-item
          return (
            <span
              key={lineIndex}
              className="flex gap-2 items-start pl-3"
            >
              <span className="text-ink-muted-80 font-semibold flex-shrink-0 min-w-[20px]">
                {/* Extract the label like "(a)" */}
                {line.match(/^(\([a-zA-Z]\)|[a-zA-Z]\))/)?.[0] ?? "•"}
              </span>
              <span className="leading-relaxed">
                {renderMathSegment(
                  line.replace(/^(\([a-zA-Z]\)|[a-zA-Z]\))\s*/, ""),
                  `l${lineIndex}`
                )}
              </span>
            </span>
          );
        }

        if (kind === "dash") {
          // Generic "- ..." → bullet item
          const content = line.replace(/^-\s*/, "");
          return (
            <span
              key={lineIndex}
              className="flex gap-2 items-start pl-2"
            >
              <span className="text-ink-muted-48 flex-shrink-0">•</span>
              <span className="leading-relaxed">
                {renderMathSegment(content, `l${lineIndex}`)}
              </span>
            </span>
          );
        }

        if (kind === "note") {
          // "Lưu ý: ..." → highlighted note line
          return (
            <span
              key={lineIndex}
              className="text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 text-[11px] leading-relaxed"
            >
              {renderMathSegment(line, `l${lineIndex}`)}
            </span>
          );
        }

        if (kind === "label") {
          // "Bước 1: ..." → bold label inline
          return (
            <span key={lineIndex} className="font-semibold leading-relaxed">
              {renderMathSegment(line, `l${lineIndex}`)}
            </span>
          );
        }

        // Plain text line
        return (
          <span key={lineIndex} className="leading-relaxed">
            {renderMathSegment(line, `l${lineIndex}`)}
          </span>
        );
      })}
    </span>
  );
}
