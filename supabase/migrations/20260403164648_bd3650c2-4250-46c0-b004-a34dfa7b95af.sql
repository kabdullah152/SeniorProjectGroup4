
CREATE TABLE public.course_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  class_name text NOT NULL,
  topic text NOT NULL,
  topic_order integer NOT NULL DEFAULT 0,
  lesson_content text,
  quiz_questions jsonb DEFAULT '[]'::jsonb,
  exercises jsonb DEFAULT '[]'::jsonb,
  study_resources jsonb DEFAULT '[]'::jsonb,
  bloom_level text,
  generation_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own course content"
  ON public.course_content FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own course content"
  ON public.course_content FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own course content"
  ON public.course_content FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own course content"
  ON public.course_content FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_course_content_user_class ON public.course_content (user_id, class_name, topic_order);
