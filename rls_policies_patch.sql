-- Re-create RLS policy creation block using pg_policies.policyname

-- Make sure RLS is enabled (already done earlier, safe to repeat)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='subjects' AND policyname='subjects_rls_org'
  ) THEN
    EXECUTE 'CREATE POLICY subjects_rls_org ON public.subjects
             USING (org_id = current_org_id())
             WITH CHECK (org_id = current_org_id())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='consents' AND policyname='consents_rls_org'
  ) THEN
    EXECUTE 'CREATE POLICY consents_rls_org ON public.consents
             USING (org_id = current_org_id())
             WITH CHECK (org_id = current_org_id())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='contexts' AND policyname='contexts_rls_org'
  ) THEN
    EXECUTE 'CREATE POLICY contexts_rls_org ON public.contexts
             USING (org_id = current_org_id())
             WITH CHECK (org_id = current_org_id())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='sessions' AND policyname='sessions_rls_org'
  ) THEN
    EXECUTE 'CREATE POLICY sessions_rls_org ON public.sessions
             USING (org_id = current_org_id())
             WITH CHECK (org_id = current_org_id())';
  END IF;
END$$;

-- Optional: enforce RLS even for table owners (stronger isolation)
-- ALTER TABLE public.subjects  FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.consents  FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.contexts  FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.sessions  FORCE ROW LEVEL SECURITY;
