-- Create learning resources table
CREATE TABLE public.learning_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  resource_type text NOT NULL CHECK (resource_type IN ('written_explanation', 'real_world_example', 'diagram', 'pre_quiz')),
  content text NOT NULL,
  subject text,
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view learning resources
CREATE POLICY "Authenticated users can view learning resources"
ON public.learning_resources
FOR SELECT
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_learning_resources_updated_at
BEFORE UPDATE ON public.learning_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();