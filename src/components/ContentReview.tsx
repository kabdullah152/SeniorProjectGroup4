import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  ClipboardCheck, CheckCircle2, XCircle, RotateCcw, Star,
  MessageSquare, Target, Loader2, ChevronDown, ChevronUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MathText } from "@/components/MathText";

interface ContentReviewProps {
  contentId: string;
  lessonContent: string | null;
  topic: string;
  className: string;
  bloomLevel: string | null;
}

interface Review {
  id: string;
  status: string;
  accuracy_score: number | null;
  alignment_score: number | null;
  bloom_match_score: number | null;
  pedagogy_score: number | null;
  inclusivity_score: number | null;
  overall_comments: string | null;
  inline_annotations: any[];
  revision_notes: string | null;
  syllabus_objectives_checked: string[];
  objectives_covered: number;
  objectives_total: number;
  created_at: string;
  updated_at: string;
}

const RUBRIC_DIMENSIONS = [
  { key: "accuracy_score", label: "Instructional Accuracy", description: "Content correctness and factual reliability" },
  { key: "alignment_score", label: "Syllabus Alignment", description: "Coverage of stated syllabus objectives" },
  { key: "bloom_match_score", label: "Bloom's Level Match", description: "Cognitive complexity matches target level" },
  { key: "pedagogy_score", label: "Pedagogical Soundness", description: "Effective teaching structure and scaffolding" },
  { key: "inclusivity_score", label: "Bias & Inclusivity", description: "Culturally neutral, diverse, accessible" },
] as const;

type RubricKey = typeof RUBRIC_DIMENSIONS[number]["key"];

export function ContentReview({ contentId, lessonContent, topic, className, bloomLevel }: ContentReviewProps) {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [syllabusObjectives, setSyllabusObjectives] = useState<string[]>([]);
  const { toast } = useToast();

  // Form state
  const [scores, setScores] = useState<Record<RubricKey, number>>({
    accuracy_score: 0,
    alignment_score: 0,
    bloom_match_score: 0,
    pedagogy_score: 0,
    inclusivity_score: 0,
  });
  const [comments, setComments] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [checkedObjectives, setCheckedObjectives] = useState<Set<string>>(new Set());

  const loadReview = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("content_reviews")
      .select("*")
      .eq("content_id", contentId)
      .eq("reviewer_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1) as any;

    if (data?.[0]) {
      const r = data[0];
      setReview(r);
      setScores({
        accuracy_score: r.accuracy_score || 0,
        alignment_score: r.alignment_score || 0,
        bloom_match_score: r.bloom_match_score || 0,
        pedagogy_score: r.pedagogy_score || 0,
        inclusivity_score: r.inclusivity_score || 0,
      });
      setComments(r.overall_comments || "");
      setRevisionNotes(r.revision_notes || "");
      setCheckedObjectives(new Set(r.syllabus_objectives_checked || []));
    }
    setLoading(false);
  }, [contentId]);

  const loadSyllabusObjectives = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("syllabi")
      .select("learning_objectives")
      .eq("user_id", session.user.id)
      .eq("class_name", className)
      .limit(1);

    if (data?.[0]?.learning_objectives) {
      setSyllabusObjectives(data[0].learning_objectives);
    }
  }, [className]);

  useEffect(() => {
    loadReview();
    loadSyllabusObjectives();
  }, [loadReview, loadSyllabusObjectives]);

  const averageScore = () => {
    const vals = Object.values(scores).filter((v) => v > 0);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
  };

  const allScored = Object.values(scores).every((v) => v > 0);

  const saveReview = async (status: string) => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    const payload = {
      content_id: contentId,
      reviewer_id: session.user.id,
      status,
      ...scores,
      overall_comments: comments || null,
      revision_notes: status === "revision_requested" ? revisionNotes : null,
      syllabus_objectives_checked: Array.from(checkedObjectives),
      objectives_covered: checkedObjectives.size,
      objectives_total: syllabusObjectives.length,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (review) {
      ({ error } = await supabase.from("content_reviews").update(payload).eq("id", review.id) as any);
    } else {
      ({ error } = await supabase.from("content_reviews").insert(payload) as any);
    }

    if (error) {
      toast({ title: "Error saving review", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "approved" ? "Content Approved ✓" : status === "revision_requested" ? "Revision Requested" : status === "rejected" ? "Content Rejected" : "Review Saved" });
      await loadReview();
      setShowForm(false);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading review…</div>;

  const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    approved: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2, label: "Approved" },
    revision_requested: { color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: RotateCcw, label: "Revision Requested" },
    rejected: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle, label: "Rejected" },
    pending: { color: "bg-muted text-muted-foreground border-border", icon: ClipboardCheck, label: "Pending Review" },
  };

  // Summary view when review exists and form is hidden
  if (review && !showForm) {
    const cfg = statusConfig[review.status] || statusConfig.pending;
    const Icon = cfg.icon;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
            <span className="text-xs text-muted-foreground">Avg: {averageScore()}/5</span>
          </div>
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setShowForm(true)}>
            <MessageSquare className="w-3 h-3" /> Edit Review
          </Button>
        </div>
        {review.overall_comments && (
          <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">{review.overall_comments}</p>
        )}
        {review.status === "revision_requested" && review.revision_notes && (
          <div className="text-xs p-2 rounded bg-amber-500/10 border border-amber-500/20">
            <strong className="text-foreground">Revision notes:</strong> {review.revision_notes}
          </div>
        )}
        <div className="grid grid-cols-5 gap-2">
          {RUBRIC_DIMENSIONS.map((dim) => (
            <div key={dim.key} className="text-center">
              <div className="text-lg font-semibold text-foreground">{(review as any)[dim.key] || "—"}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">{dim.label}</div>
            </div>
          ))}
        </div>
        {review.objectives_total > 0 && (
          <div className="text-xs text-muted-foreground">
            <Target className="w-3 h-3 inline mr-1" />
            Objectives covered: {review.objectives_covered}/{review.objectives_total}
          </div>
        )}
      </div>
    );
  }

  // Review form
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4" /> SME Quality Review
        </h4>
        {review && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
        )}
      </div>

      {/* Side-by-side: Syllabus Objectives + Content Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border border-border rounded-lg p-3">
          <h5 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
            <Target className="w-3 h-3" /> Syllabus Objectives
          </h5>
          {syllabusObjectives.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {syllabusObjectives.map((obj, i) => (
                <label key={i} className="flex items-start gap-2 text-xs cursor-pointer">
                  <Checkbox
                    checked={checkedObjectives.has(obj)}
                    onCheckedChange={(checked) => {
                      setCheckedObjectives((prev) => {
                        const next = new Set(prev);
                        checked ? next.add(obj) : next.delete(obj);
                        return next;
                      });
                    }}
                    className="mt-0.5"
                  />
                  <span className="text-muted-foreground">{obj}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No syllabus objectives found. Upload and parse a syllabus first.</p>
          )}
          {syllabusObjectives.length > 0 && (
            <div className="mt-2 text-[10px] text-muted-foreground">
              ✓ {checkedObjectives.size}/{syllabusObjectives.length} objectives covered
            </div>
          )}
        </div>
        <div className="border border-border rounded-lg p-3">
          <h5 className="text-xs font-semibold text-foreground mb-2">Content Preview</h5>
          <div className="max-h-48 overflow-y-auto text-xs text-muted-foreground space-y-1">
            {lessonContent ? (
              lessonContent.split("\n").slice(0, 20).map((line, i) => (
                <p key={i}><MathText text={line} /></p>
              ))
            ) : (
              <p>No content generated yet.</p>
            )}
            {(lessonContent?.split("\n").length || 0) > 20 && (
              <p className="text-primary text-[10px]">… truncated for preview</p>
            )}
          </div>
          {bloomLevel && (
            <Badge variant="outline" className="mt-2 text-[10px]">Bloom's: {bloomLevel}</Badge>
          )}
        </div>
      </div>

      {/* Rubric Scoring */}
      <div className="space-y-3">
        <h5 className="text-xs font-semibold text-foreground">Rubric Scoring (1–5)</h5>
        {RUBRIC_DIMENSIONS.map((dim) => (
          <div key={dim.key} className="flex items-center gap-3">
            <div className="w-40 shrink-0">
              <div className="text-xs font-medium text-foreground">{dim.label}</div>
              <div className="text-[10px] text-muted-foreground">{dim.description}</div>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => setScores((prev) => ({ ...prev, [dim.key]: val }))}
                  className={`w-8 h-8 rounded-md text-xs font-medium transition-all border ${
                    scores[dim.key] === val
                      ? "bg-primary text-primary-foreground border-primary"
                      : scores[dim.key] > 0 && val <= scores[dim.key]
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            {scores[dim.key] > 0 && scores[dim.key] <= 3 && (
              <span className="text-[10px] text-amber-500">⚠ Comment required for low scores</span>
            )}
          </div>
        ))}
        <div className="text-right text-xs text-muted-foreground">
          Average: <span className="font-semibold text-foreground">{averageScore()}</span>/5
        </div>
      </div>

      <Separator />

      {/* Comments */}
      <div>
        <Label className="text-xs">Overall Comments</Label>
        <Textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="General feedback on instructional quality, content gaps, strengths…"
          className="mt-1 text-xs min-h-[80px]"
        />
      </div>

      {/* Revision Notes (shown when requesting revision) */}
      <div>
        <Label className="text-xs">Revision Notes (for AI re-generation)</Label>
        <Textarea
          value={revisionNotes}
          onChange={(e) => setRevisionNotes(e.target.value)}
          placeholder="Specific changes needed for the next draft…"
          className="mt-1 text-xs min-h-[60px]"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
          onClick={() => saveReview("approved")}
          disabled={!allScored || saving}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
          onClick={() => saveReview("revision_requested")}
          disabled={!allScored || saving || !revisionNotes.trim()}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
          Request Revision
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={() => saveReview("rejected")}
          disabled={!allScored || saving}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
          Reject
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-xs"
          onClick={() => saveReview("pending")}
          disabled={saving}
        >
          Save Draft
        </Button>
      </div>
      {!allScored && <p className="text-[10px] text-muted-foreground">Score all 5 rubric dimensions to approve, request revision, or reject.</p>}
    </div>
  );
}
