-- Event recording is an internal server operation. The public API should not
-- be able to call these SECURITY DEFINER functions directly.

revoke execute on function public.record_impression(text, uuid, text)
  from public, anon, authenticated;
revoke execute on function public.record_conversion(text, uuid, text)
  from public, anon, authenticated;

grant execute on function public.record_impression(text, uuid, text)
  to service_role;
grant execute on function public.record_conversion(text, uuid, text)
  to service_role;
