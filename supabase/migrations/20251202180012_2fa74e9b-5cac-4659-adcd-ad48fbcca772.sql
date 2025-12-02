-- Create storage bucket for syllabi
INSERT INTO storage.buckets (id, name, public)
VALUES ('syllabi', 'syllabi', false);

-- Create policies for syllabus uploads
CREATE POLICY "Users can upload their own syllabi"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'syllabi' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own syllabi"
ON storage.objects
FOR SELECT
USING (bucket_id = 'syllabi' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own syllabi"
ON storage.objects
FOR DELETE
USING (bucket_id = 'syllabi' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create table to track syllabus metadata
CREATE TABLE public.syllabi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  class_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.syllabi ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own syllabi"
ON public.syllabi
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own syllabi"
ON public.syllabi
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own syllabi"
ON public.syllabi
FOR DELETE
USING (auth.uid() = user_id);