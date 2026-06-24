GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_above(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_tool_parent(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_or_above(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.owns_tool_parent(uuid, uuid) TO service_role;