-- Experiments
-- Core experiment records. Status transitions enforced at the API layer.

create table experiments (
  id                   text        primary key,
  user_id              uuid        not null references auth.users(id) on delete cascade,
  name                 text        not null,
  hypothesis           text,
  control_description  text        not null,
  variant_description  text        not null,
  goal                 text        not null,
  status               text        not null default 'draft'
                                   check (status in ('draft', 'live', 'inactive', 'archived')),
  created_at           timestamptz not null default now(),
  launched_at          timestamptz,
  concluded_at         timestamptz,
  conclusion           jsonb
);

create index idx_experiments_user_id on experiments(user_id);
create index idx_experiments_status  on experiments(status);
