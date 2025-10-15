CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gin;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_namespace n
    JOIN pg_proc p ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'current_org_id'
  ) THEN
    EXECUTE $sql$
      CREATE FUNCTION public.current_org_id() RETURNS uuid
      LANGUAGE sql STABLE AS $fn$
        SELECT NULLIF(current_setting('app.current_org_id', true), '')::uuid
      $fn$;
    $sql$;
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) >= 2),
  org_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  external_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subjects_org ON public.subjects(org_id);
CREATE INDEX IF NOT EXISTS idx_subjects_external_ref ON public.subjects(external_ref);

CREATE TABLE IF NOT EXISTS public.consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  purpose text NOT NULL,
  scopes text[] NOT NULL,
  version text NOT NULL DEFAULT 'v1',
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  meta jsonb,
  CONSTRAINT consents_revoked_after_granted CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);
CREATE INDEX IF NOT EXISTS idx_consents_org_subject ON public.consents(org_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_consents_active ON public.consents(org_id, subject_id, purpose) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS public.contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  label text,
  json jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contexts_json_is_object CHECK (jsonb_typeof(json) = 'object')
);
CREATE INDEX IF NOT EXISTS idx_contexts_org_subject_created ON public.contexts(org_id, subject_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contexts_json_gin ON public.contexts USING GIN (json);

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  policy_key text NOT NULL,
  osdk_session_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_org ON public.sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_sessions_policy ON public.sessions(org_id, policy_key);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at_now') THEN
    CREATE FUNCTION public.set_updated_at_now() RETURNS trigger
    LANGUAGE plpgsql AS $fn$
    BEGIN
      NEW.updated_at := now();
      RETURN NEW;
    END;
    $fn$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contexts_set_updated_at') THEN
    CREATE TRIGGER trg_contexts_set_updated_at
      BEFORE UPDATE ON public.contexts
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at_now();
  END IF;
END$$;

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname='subjects_rls_org') THEN
    EXECUTE 'CREATE POLICY subjects_rls_org ON public.subjects USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id())';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname='consents_rls_org') THEN
    EXECUTE 'CREATE POLICY consents_rls_org ON public.consents USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id())';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname='contexts_rls_org') THEN
    EXECUTE 'CREATE POLICY contexts_rls_org ON public.contexts USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id())';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname='sessions_rls_org') THEN
    EXECUTE 'CREATE POLICY sessions_rls_org ON public.sessions USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id())';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_role') THEN
    CREATE ROLE app_role LOGIN;
  END IF;
END$$;

GRANT USAGE ON SCHEMA public TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects, public.consents, public.contexts, public.sessions TO app_role;
GRANT SELECT ON public.orgs TO app_role;

INSERT INTO public.orgs (id, name, org_key)
VALUES ('00000000-0000-0000-0000-000000000001','Acme Demo Org','DEMO_ORG_KEY')
ON CONFLICT (id) DO NOTHING;
