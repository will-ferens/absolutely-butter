-- Fix handle_new_user search_path
-- The trigger runs in the auth schema context; without an explicit search_path
-- the unqualified table name "profiles" resolves to auth.profiles (which doesn't
-- exist). Fully-qualify the target table and pin the search_path to public.

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
