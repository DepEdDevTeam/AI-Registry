
-- Partners: public-readable
GRANT SELECT ON public.partners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;

-- Partner tool details: public can read approved-of-approved (via RLS); authenticated can read all
GRANT SELECT ON public.partner_tool_details TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_tool_details TO authenticated;
GRANT ALL ON public.partner_tool_details TO service_role;

-- Profiles: authenticated-only (every policy scopes to auth.uid)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- User roles: authenticated-only
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Audit logs: authenticated insert/read (admins via RLS)
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- Proposal comments: authenticated-only
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposal_comments TO authenticated;
GRANT ALL ON public.proposal_comments TO service_role;
