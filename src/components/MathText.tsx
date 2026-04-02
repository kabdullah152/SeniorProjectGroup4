import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * Renders text with inline LaTeX math expressions.
 * Supports both $...$ (inline) and $$...$$ (block) delimiters.
 */
export const MathText = ({ text, className = "" }: MathTextProps) => {
  const rendered = useMemo(() => {
    if (!text) return "";

    // Split on $$...$$ (block) and $...$ (inline) math delimiters
    // Process block math first, then inline
    const parts: { type: "text" | "inline" | "block"; content: string }[] = [];
    
    // Match $$...$$ and $...$, being careful not to match escaped \$ or empty $$
    const regex = /\$\$([\s\S]*?)\$\$|\$((?!\s)[^$]*?(?<!\s))\$/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before this match
      if (match.index > lastIndex) {
        parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
      }

      if (match[1] !== undefined) {
        // Block math $$...$$
        parts.push({ type: "block", content: match[1] });
      } else if (match[2] !== undefined) {
        // Inline math $...$
        parts.push({ type: "inline", content: match[2] });
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: "text", content: text.slice(lastIndex) });
    }

    // If no math found, return original text
    if (parts.length === 0) return text;
    if (parts.length === 1 && parts[0].type === "text") return text;

    return parts
      .map((part, i) => {
        if (part.type === "text") {
          return part.content;
        }
        try {
          const html = katex.renderToString(part.content, {
            throwOnError: false,
            displayMode: part.type === "block",
          });
          return `<span class="katex-wrapper" data-idx="${i}">${html}</span>`;
        } catch {
          return `$${part.content}$`;
        }
      })
      .join("");
  }, [text]);

  // If no math delimiters found, render as plain text
  if (rendered === text) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
};
