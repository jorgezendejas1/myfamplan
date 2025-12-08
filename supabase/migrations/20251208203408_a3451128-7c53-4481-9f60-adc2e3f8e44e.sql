-- Create calendars table for cloud persistence
CREATE TABLE public.calendars (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id text NOT NULL UNIQUE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#4285F4',
  is_visible boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;

-- Allow all operations (this is a public calendar app without auth)
CREATE POLICY "Allow all operations on calendars" 
ON public.calendars 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_calendars_updated_at
BEFORE UPDATE ON public.calendars
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default calendars
INSERT INTO public.calendars (calendar_id, name, color, is_visible, is_default) VALUES
  ('primary', 'Mi Calendario', '#4285F4', true, true),
  ('work', 'Trabajo', '#34A853', true, false),
  ('personal', 'Personal', '#EA4335', true, false)
ON CONFLICT (calendar_id) DO NOTHING;