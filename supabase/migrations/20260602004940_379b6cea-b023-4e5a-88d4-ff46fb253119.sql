ALTER TABLE public.partner_tool_details
ADD COLUMN IF NOT EXISTS tool_logo_svg TEXT NOT NULL DEFAULT '';