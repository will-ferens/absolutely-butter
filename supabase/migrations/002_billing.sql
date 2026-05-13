-- Billing
-- Adds subscription and Stripe fields to profiles.
-- Also updates the new-user trigger to set trial_ends_at explicitly.

alter table profiles
  add column trial_ends_at          timestamptz not null
                                     default (now() + interval '30 days'),
  add column subscription_status    text        not null
                                     default 'trialing'
                                     check (subscription_status in
                                       ('trialing', 'active', 'past_due', 'canceled')),
  add column stripe_customer_id     text        unique,
  add column stripe_subscription_id text        unique;

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
