-- Profiles
-- Extends Supabase's auth.users with app-specific fields.
-- Created automatically via a trigger on auth.users insert.

create table profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  api_key     text        unique not null,
  created_at  timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, api_key)
  values (
    new.id,
    'pk_live_' || replace(replace(rtrim(encode(extensions.gen_random_bytes(18), 'base64'), E'=\n'), '+', '-'), '/', '_')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
