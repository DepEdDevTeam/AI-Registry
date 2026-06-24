
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_above(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.owns_tool_parent(uuid, uuid) FROM authenticated;
