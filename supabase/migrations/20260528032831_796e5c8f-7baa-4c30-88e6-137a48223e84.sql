ALTER TABLE public.partner_tool_details
  ADD COLUMN IF NOT EXISTS tool_objective text DEFAULT '',
  ADD COLUMN IF NOT EXISTS target_users text DEFAULT '',
  ADD COLUMN IF NOT EXISTS estimated_users text DEFAULT '',
  ADD COLUMN IF NOT EXISTS use_case text DEFAULT '',
  ADD COLUMN IF NOT EXISTS budget text DEFAULT '',
  ADD COLUMN IF NOT EXISTS tech_requirements text DEFAULT '',
  ADD COLUMN IF NOT EXISTS training_required text DEFAULT 'needed';