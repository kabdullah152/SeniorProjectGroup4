-- Create table for storing completed quiz results
CREATE TABLE public.quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  class_name text NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  weak_areas text[] NOT NULL DEFAULT '{}',
  strong_areas text[] NOT NULL DEFAULT '{}',
  objectives jsonb DEFAULT '[]',
  resources jsonb DEFAULT '[]',
  completed_objectives integer[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, class_name)
);

-- Enable RLS
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own quiz results"
ON public.quiz_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz results"
ON public.quiz_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz results"
ON public.quiz_results FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quiz results"
ON public.quiz_results FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_quiz_results_updated_at
BEFORE UPDATE ON public.quiz_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();