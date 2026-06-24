-- Create partners table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  tools text DEFAULT '',
  theme_config jsonb DEFAULT '{"primary": "#3B82F6", "secondary": "#1E40AF", "accent": "#60A5FA"}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create proposed_partners table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.proposed_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  theme_config jsonb DEFAULT '{"primary": "#3B82F6", "secondary": "#1E40AF", "accent": "#60A5FA"}'::jsonb,
  logo_svg text DEFAULT '',
  proposed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposed_partners ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for partners table
CREATE POLICY "Anyone authenticated can read partners"
  ON public.partners FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert partners"
  ON public.partners FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add RLS policies for proposed_partners table
CREATE POLICY "Anyone authenticated can read proposed partners"
  ON public.proposed_partners FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert proposed partners"
  ON public.proposed_partners FOR INSERT
  TO authenticated
  WITH CHECK (true);