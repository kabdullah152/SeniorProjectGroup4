CREATE OR REPLACE VIEW public.profiles_safe AS
SELECT id, email, full_name, university_id, learning_styles, canvas_domain, canvas_connected_at, created_at, updated_at
FROM public.profiles;