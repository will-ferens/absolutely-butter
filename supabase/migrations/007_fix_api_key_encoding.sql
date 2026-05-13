-- Fix api_key generation: 'base64url' is not a valid PostgreSQL encoding.
-- Use base64 + string replacement to produce a URL-safe key.

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, api_key, trial_ends_at)
  values (
    new.id,
    'pk_live_' || replace(replace(rtrim(encode(extensions.gen_random_bytes(18), 'base64'), E'=\n'), '+', '-'), '/', '_'),
    now() + interval '30 days'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;
