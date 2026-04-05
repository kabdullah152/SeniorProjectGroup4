import { MathText } from "@/components/MathText";
import { BookOpen, Lightbulb, ListChecks, PenTool, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonRendererProps {
  content: string;
  moduleType?: string;
}

const sectionIcons: Record<string, typeof BookOpen> = {
  "concept overview": BookOpen,
  "intuition": Lightbulb,
  "step-by-step": PenTool,
  "key takeaways": ListChecks,
  "preparation": Target,
};

const getSectionIcon = (heading: string) => {
  const lower = heading.toLowerCase();
  for (const [key, Icon] of Object.entries(sectionIcons)) {
    if (lower.includes(key)) return Icon;
  }
  return BookOpen;
};

export const LessonRenderer = ({ content, moduleType }: LessonRendererProps) => {
  // Split content into sections by ## headers
  const sections = content.split(/(?=^## )/m).filter(Boolean);

  if (sections.length <= 1) {
    // No clear sections — render as plain markdown
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-foreground leading-relaxed">
          <MathText text={content} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section, idx) => {
        const lines = section.trim().split("\n");
        const headerLine = lines[0]?.replace(/^##\s*/, "").replace(/^\d+\.\s*/, "").trim() || "";
        const body = lines.slice(1).join("\n").trim();
        const Icon = getSectionIcon(headerLine);

        return (
          <div
            key={idx}
            className={cn(
              "rounded-lg border border-border p-4",
              idx === 0 && "bg-primary/5 border-primary/20"
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{headerLine}</h3>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed text-sm">
                <MathText text={body} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
