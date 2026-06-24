ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS contact_person text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_position text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS background text DEFAULT '';