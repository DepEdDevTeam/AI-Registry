
-- Add logo_svg column to proposed_partners
ALTER TABLE public.proposed_partners ADD COLUMN IF NOT EXISTS logo_svg text DEFAULT '';

-- Create partner_tool_details table for governance metadata
CREATE TABLE public.partner_tool_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES public.proposed_partners(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  risk_classification text NOT NULL DEFAULT 'Minimal',
  intended_use text DEFAULT '',
  privacy_impact_assessment text DEFAULT '',
  compliance_assessment text DEFAULT '',
  responsible_officer text DEFAULT '',
  oversight_mechanism text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_tool_details ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone authenticated can read tool details"
  ON public.partner_tool_details FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tool details"
  ON public.partner_tool_details FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tool details"
  ON public.partner_tool_details FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tool details"
  ON public.partner_tool_details FOR DELETE
  TO authenticated
  USING (true);
