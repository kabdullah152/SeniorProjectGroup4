import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Target, BookOpen, CheckCircle2, Loader2, Lock, Unlock,
  ChevronRight, Lightbulb, PenTool, GraduationCap, Zap,
  Clock, Trophy, ArrowRight, FileText,
} from "lucide-react";
import { useStructuredStudyPlan, FocusArea, StudyModule } from "@/hooks/useStructuredStudyPlan";
import { MiniQuiz } from "@/components/MiniQuiz";
import { cn } from "@/lib/utils";

interface StructuredStudyPlanProps {
  className: string;
  learningStyles: string[];
  hasPlacementQuiz: boolean;
}

const moduleTypeConfig: Record<string, { icon: typeof BookOpen; label: string; color: string }> = {
  concept: { icon: Lightbulb, label: "Concept Explanation", color: "text-amber-500" },
  "worked-example": { icon: FileText, label: "Worked Example", color: "text-blue-500" },
  "guided-practice": { icon: PenTool, label: "Guided Practice", color: "text-green-500" },
  exercise: { icon: Zap, label: "Interactive Exercise", color: "text-purple-500" },
};

export const StructuredStudyPlan = ({ className, learningStyles, hasPlacementQuiz }: StructuredStudyPlanProps) => {
  const plan = useStructuredStudyPlan(className, learningStyles);
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);
  const [quizGateOpen, setQuizGateOpen] = useState(false);
  const [quizGateAreaId, setQuizGateAreaId] = useState<string | null>(null);

  const activeArea = plan.focusAreas.find(a => a.id === plan.activeFocusAreaId);
  const openModule = activeArea?.modules.find(m => m.id === openModuleId) || null;

  const handleOpenModule = async (mod: StudyModule, topic: string) => {
    setOpenModuleId(mod.id);
    if (!mod.content) {
      await plan.loadModuleContent(mod, topic);
    }
  };

  const handleCompleteModule = async (moduleId: string) => {
    await plan.completeModule(moduleId);
  };

  const handleOpenQuizGate = (areaId: string) => {
    setQuizGateAreaId(areaId);
    setQuizGateOpen(true);
  };

  if (!hasPlacementQuiz) {
    return null;
  }

  // Empty state — no plan generated yet
  if (!plan.isLoading && plan.focusAreas.length === 0) {
    return (
      <Card className="p-6 border-border shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Structured Study Plan</h3>
            <p className="text-sm text-muted-foreground">Module-based learning path from your syllabus</p>
          </div>
        </div>
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground mb-4">Generate a structured learning path based on your syllabus topics</p>
          <Button onClick={plan.generatePlan} disabled={plan.isGenerating}>
            {plan.isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Plan...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Study Plan
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  if (plan.isLoading) {
    return (
      <Card className="p-6 border-border shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading study plan...</span>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6 border-border shadow-[var(--shadow-soft)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Structured Study Plan</h3>
              <p className="text-sm text-muted-foreground">
                {plan.focusAreas.length} Focus Areas • ~{plan.estimatedWeeks} weeks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{plan.overallProgress}% Complete</p>
              <p className="text-xs text-muted-foreground">{plan.completedModules}/{plan.totalModules} modules</p>
            </div>
            <Button variant="outline" size="sm" onClick={plan.generatePlan} disabled={plan.isGenerating}>
              {plan.isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Regenerate"}
            </Button>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mb-6">
          <Progress value={plan.overallProgress} className="h-3" />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">{plan.completedAreas}/{plan.focusAreas.length} areas completed</span>
            <span className="text-xs text-muted-foreground">Est. completion: {plan.estimatedWeeks} weeks</span>
          </div>
        </div>

        {/* Focus Areas Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Focus Area List */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Learning Path
            </h4>
            <ScrollArea className="h-[400px] pr-2">
              <div className="space-y-2">
                {plan.focusAreas.map((area, idx) => {
                  const progress = plan.getFocusAreaProgress(area);
                  const isActive = area.id === plan.activeFocusAreaId;
                  const isLocked = !area.is_unlocked;
                  const isComplete = area.quiz_passed;

                  return (
                    <div
                      key={area.id}
                      className={cn(
                        "p-3 rounded-lg border transition-all cursor-pointer",
                        isLocked && "opacity-50 cursor-not-allowed bg-muted/30 border-border",
                        isActive && !isLocked && "border-primary bg-primary/5 shadow-sm",
                        isComplete && "border-green-500/30 bg-green-500/5",
                        !isActive && !isLocked && !isComplete && "border-border hover:border-primary/50 bg-card"
                      )}
                      onClick={() => !isLocked && plan.setActiveFocusAreaId(area.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                          isComplete ? "bg-green-500 text-white" :
                          isLocked ? "bg-muted text-muted-foreground" :
                          isActive ? "bg-primary text-primary-foreground" :
                          "bg-muted text-foreground"
                        )}>
                          {isComplete ? <CheckCircle2 className="w-4 h-4" /> :
                           isLocked ? <Lock className="w-3 h-3" /> :
                           idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn("text-sm font-medium truncate",
                              isComplete ? "text-green-600" : isLocked ? "text-muted-foreground" : "text-foreground"
                            )}>
                              {area.topic}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={progress} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{progress}%</span>
                          </div>
                        </div>
                        {isComplete && <Trophy className="w-4 h-4 text-green-500 flex-shrink-0" />}
                        {!isLocked && !isComplete && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Active Focus Area Detail */}
          <div>
            {activeArea ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    {activeArea.topic}
                  </h4>
                  {activeArea.estimated_time_minutes && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      ~{activeArea.estimated_time_minutes} min
                    </Badge>
                  )}
                </div>

                {/* Modules */}
                <ScrollArea className="h-[320px] pr-2">
                  <div className="space-y-2">
                    {activeArea.modules.map((mod, idx) => {
                      const config = moduleTypeConfig[mod.module_type] || moduleTypeConfig.concept;
                      const Icon = config.icon;
                      const prevComplete = idx === 0 || activeArea.modules[idx - 1].is_completed;

                      return (
                        <div
                          key={mod.id}
                          className={cn(
                            "p-3 rounded-lg border transition-all",
                            mod.is_completed ? "bg-green-500/5 border-green-500/20" :
                            prevComplete ? "bg-card border-border hover:border-primary/50 cursor-pointer" :
                            "opacity-50 bg-muted/30 border-border cursor-not-allowed"
                          )}
                          onClick={() => prevComplete && !mod.is_completed && handleOpenModule(mod, activeArea.topic)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                              mod.is_completed ? "bg-green-500/10" : "bg-muted"
                            )}>
                              {mod.is_completed ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Icon className={cn("w-3.5 h-3.5", config.color)} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium",
                                mod.is_completed ? "text-green-600 line-through" : "text-foreground"
                              )}>
                                {mod.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-xs py-0">
                                  {config.label}
                                </Badge>
                                {mod.estimated_time_minutes && (
                                  <span className="text-xs text-muted-foreground">{mod.estimated_time_minutes} min</span>
                                )}
                              </div>
                            </div>
                            {mod.is_completed && (
                              <Button variant="ghost" size="sm" className="h-6 text-xs px-2"
                                onClick={(e) => { e.stopPropagation(); plan.uncompleteModule(mod.id); }}>
                                Undo
                              </Button>
                            )}
                            {prevComplete && !mod.is_completed && (
                              <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Quiz Gate */}
                    {activeArea.modules.length > 0 && (
                      <div className={cn(
                        "p-4 rounded-lg border-2 border-dashed mt-3 text-center",
                        plan.allModulesComplete(activeArea) ? "border-primary bg-primary/5" : "border-muted bg-muted/20"
                      )}>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {activeArea.quiz_passed ? (
                            <Trophy className="w-5 h-5 text-green-500" />
                          ) : plan.allModulesComplete(activeArea) ? (
                            <Unlock className="w-5 h-5 text-primary" />
                          ) : (
                            <Lock className="w-5 h-5 text-muted-foreground" />
                          )}
                          <span className={cn("font-semibold text-sm",
                            activeArea.quiz_passed ? "text-green-600" : "text-foreground"
                          )}>
                            {activeArea.quiz_passed ? "Quiz Passed!" : "Focus Area Quiz Gate"}
                          </span>
                        </div>
                        {activeArea.quiz_passed ? (
                          <p className="text-xs text-green-600">Scored {activeArea.quiz_score}% — Next area unlocked</p>
                        ) : plan.allModulesComplete(activeArea) ? (
                          <>
                            <p className="text-xs text-muted-foreground mb-3">
                              Complete all modules ✓ — Pass with {activeArea.quiz_threshold}% to unlock next area
                            </p>
                            <Button size="sm" onClick={() => handleOpenQuizGate(activeArea.id)}>
                              Take Quiz
                            </Button>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Complete all modules above to unlock this quiz ({activeArea.quiz_threshold}% required)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <p className="text-sm">Select a focus area to view modules</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Module Content Dialog */}
      <Dialog open={!!openModuleId} onOpenChange={() => setOpenModuleId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {openModule && (() => {
                const config = moduleTypeConfig[openModule.module_type] || moduleTypeConfig.concept;
                const Icon = config.icon;
                return <Icon className={cn("w-5 h-5", config.color)} />;
              })()}
              {openModule?.title}
            </DialogTitle>
            <DialogDescription>
              {openModule && (moduleTypeConfig[openModule.module_type]?.label || "Module")}
              {openModule?.estimated_time_minutes && ` • ~${openModule.estimated_time_minutes} min`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[55vh] pr-4">
            {plan.loadingModuleContent === openModule?.id ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Generating content...</span>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-foreground">
                  {openModule?.content || "Content not available."}
                </div>
              </div>
            )}
          </ScrollArea>
          {openModule && !openModule.is_completed && (
            <div className="flex justify-end pt-4 border-t border-border">
              <Button onClick={() => { handleCompleteModule(openModule.id); setOpenModuleId(null); }}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark as Complete
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quiz Gate Modal */}
      {quizGateAreaId && (() => {
        const gateArea = plan.focusAreas.find(a => a.id === quizGateAreaId);
        if (!gateArea) return null;
        return (
          <MiniQuiz
            isOpen={quizGateOpen}
            onClose={(score?: number, total?: number) => {
              setQuizGateOpen(false);
              if (score !== undefined && total !== undefined) {
                plan.passQuizGate(quizGateAreaId, score, total);
              }
              setQuizGateAreaId(null);
            }}
            className={className}
            weakAreas={[gateArea.topic]}
            learningStyles={learningStyles}
          />
        );
      })()}
    </>
  );
};
