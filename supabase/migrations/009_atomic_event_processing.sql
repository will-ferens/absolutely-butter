-- Atomic event processing for server-authoritative attribution.
-- Event ingestion remains fire-and-forget at the HTTP boundary, but all
-- mutations and deduplication decisions happen transactionally in Postgres.

create or replace function record_impression(
  p_experiment_id text,
  p_session_id uuid,
  p_arm text
)
returns table(outcome text, stored_arm text, mismatch boolean) as $$
declare
  inserted_arm text;
  experiment_status text;
begin
  select status into experiment_status
  from experiments
  where id = p_experiment_id
  for share;

  if experiment_status is distinct from 'live' then
    return query select 'inactive'::text, null::text, false;
    return;
  end if;

  insert into experiment_sessions (experiment_id, session_id, arm, converted)
  values (p_experiment_id, p_session_id, p_arm, false)
  on conflict (experiment_id, session_id) do nothing
  returning arm into inserted_arm;

  if inserted_arm is not null then
    update experiment_arms
    set impressions = impressions + 1, updated_at = now()
    where experiment_id = p_experiment_id and arm = inserted_arm;

    return query select 'counted'::text, inserted_arm, false;
    return;
  end if;

  select s.arm into stored_arm
  from experiment_sessions s
  where s.experiment_id = p_experiment_id and s.session_id = p_session_id;

  mismatch := stored_arm is distinct from p_arm;
  outcome := case when mismatch then 'mismatch' else 'duplicate' end;
  return next;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function record_conversion(
  p_experiment_id text,
  p_session_id uuid,
  p_submitted_arm text
)
returns table(outcome text, stored_arm text, mismatch boolean) as $$
declare
  was_converted boolean;
  experiment_status text;
begin
  select status into experiment_status
  from experiments
  where id = p_experiment_id
  for share;

  if experiment_status is distinct from 'live' then
    return query select 'inactive'::text, null::text, false;
    return;
  end if;

  -- Serialize conversion claims for one experiment/session.
  select s.arm, s.converted into stored_arm, was_converted
  from experiment_sessions s
  where s.experiment_id = p_experiment_id and s.session_id = p_session_id
  for update;

  if not found then
    return query select 'unknown_session'::text, null::text, false;
    return;
  end if;

  mismatch := stored_arm is distinct from p_submitted_arm;
  if mismatch then
    outcome := 'mismatch';
    return next;
    return;
  end if;

  if was_converted then
    outcome := 'duplicate';
    return next;
    return;
  end if;

  update experiment_sessions
  set converted = true
  where experiment_id = p_experiment_id and session_id = p_session_id;

  update experiment_arms
  set conversions = conversions + 1, updated_at = now()
  where experiment_id = p_experiment_id and arm = stored_arm;

  outcome := 'counted';
  return next;
end;
$$ language plpgsql security definer set search_path = public;
