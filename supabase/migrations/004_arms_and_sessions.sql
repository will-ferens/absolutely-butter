-- Experiment Arms
-- Two rows per experiment (control + variant).
-- All statistics are derived from impressions/conversions at read time — nothing is precomputed.

create table experiment_arms (
  id             uuid        primary key default gen_random_uuid(),
  experiment_id  text        not null references experiments(id) on delete cascade,
  arm            text        not null check (arm in ('control', 'variant')),
  impressions    integer     not null default 0,
  conversions    integer     not null default 0,
  updated_at     timestamptz not null default now(),

  unique (experiment_id, arm)
);

create index idx_arms_experiment_id on experiment_arms(experiment_id);


-- Experiment Sessions
-- Deduplication table. One row per (experiment, session).
-- Can be purged after an experiment is archived.

create table experiment_sessions (
  id             uuid        primary key default gen_random_uuid(),
  experiment_id  text        not null references experiments(id) on delete cascade,
  session_id     uuid        not null,
  arm            text        not null check (arm in ('control', 'variant')),
  converted      boolean     not null default false,
  first_seen     timestamptz not null default now(),

  unique (experiment_id, session_id)
);

create index idx_sessions_experiment_id on experiment_sessions(experiment_id);


-- Atomic increment RPCs
-- Called by the event processing service to avoid race conditions.

create or replace function increment_impressions(p_experiment_id text, p_arm text)
returns void as $$
  update experiment_arms
  set impressions = impressions + 1,
      updated_at  = now()
  where experiment_id = p_experiment_id
    and arm = p_arm;
$$ language sql;

create or replace function increment_conversions(p_experiment_id text, p_arm text)
returns void as $$
  update experiment_arms
  set conversions = conversions + 1,
      updated_at  = now()
  where experiment_id = p_experiment_id
    and arm = p_arm;
$$ language sql;
