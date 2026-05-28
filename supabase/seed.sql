-- Development seed
-- Creates one test user with an active subscription and two sample experiments.
--
-- Credentials: dev@absolutelybutter.com / devpassword123

DO $$
DECLARE
  v_user_id    uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  v_live_id    text := 'seed_cta_button_color';
  v_draft_id   text := 'seed_onboarding_flow';
BEGIN

  -- Test user
  INSERT INTO auth.users (
    instance_id, id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated', 'authenticated',
    'dev@absolutelybutter.com',
    extensions.crypt('devpassword123', extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{}',
    false
  ) ON CONFLICT (id) DO NOTHING;

  -- Override trial default → active subscription
  UPDATE public.profiles
  SET subscription_status = 'active',
      trial_ends_at = now() + interval '30 days'
  WHERE id = v_user_id;

  -- Live experiment (14 days of data, strong signal favouring variant)
  INSERT INTO experiments (
    id, user_id, name, hypothesis,
    control_description, variant_description, goal,
    status, launched_at
  ) VALUES (
    v_live_id, v_user_id,
    'CTA Button Color',
    'A green CTA button will outperform the default blue because it contrasts better with the hero section.',
    'Blue button (#3B82F6)',
    'Green button (#16A34A)',
    'Click-through to signup page',
    'live',
    now() - interval '14 days'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO experiment_arms (experiment_id, arm, impressions, conversions) VALUES
    (v_live_id, 'control', 152, 15),
    (v_live_id, 'variant', 148, 23)
  ON CONFLICT (experiment_id, arm) DO NOTHING;

  -- Draft experiment (no data yet)
  INSERT INTO experiments (
    id, user_id, name, hypothesis,
    control_description, variant_description, goal,
    status
  ) VALUES (
    v_draft_id, v_user_id,
    'Onboarding Flow',
    'A guided 3-step onboarding will increase activation vs the current single-page setup.',
    'Single-page onboarding form',
    '3-step guided onboarding wizard',
    'Complete first experiment creation',
    'draft'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO experiment_arms (experiment_id, arm, impressions, conversions) VALUES
    (v_draft_id, 'control', 0, 0),
    (v_draft_id, 'variant', 0, 0)
  ON CONFLICT (experiment_id, arm) DO NOTHING;

END $$;
