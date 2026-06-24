DELETE FROM public.partner_tool_details WHERE partner_id IN ('9bfae5ea-7a0f-4af0-8c68-14e83677c024','e3bafccb-ca30-4603-8282-b9b42ab218fd');
DELETE FROM public.partners WHERE id IN ('9bfae5ea-7a0f-4af0-8c68-14e83677c024','e3bafccb-ca30-4603-8282-b9b42ab218fd');
DELETE FROM public.user_roles WHERE user_id = '737db474-d6dd-4340-8aa5-b8149a42f996';
DELETE FROM public.profiles WHERE id = '737db474-d6dd-4340-8aa5-b8149a42f996';
DELETE FROM auth.users WHERE id = '737db474-d6dd-4340-8aa5-b8149a42f996';