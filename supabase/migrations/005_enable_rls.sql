-- Enable RLS on all public tables.
-- The server uses the service-role key which bypasses RLS, so no policies are needed.
-- This blocks any direct access via the anon key as defense-in-depth.

alter table public.profiles          enable row level security;
alter table public.experiments       enable row level security;
alter table public.experiment_arms   enable row level security;
alter table public.experiment_sessions enable row level security;
