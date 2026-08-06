-- 1) Enums
DO $$ BEGIN
  CREATE TYPE public.task_member_role AS ENUM ('admin', 'member', 'guest');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.task_permission_level AS ENUM ('view', 'comment', 'edit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) task_members.role
ALTER TABLE public.task_members
  ADD COLUMN IF NOT EXISTS role public.task_member_role;

-- 3) task_space_access
CREATE TABLE IF NOT EXISTS public.task_space_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_member_id uuid NOT NULL REFERENCES public.task_members(id) ON DELETE CASCADE,
  space_id uuid NOT NULL REFERENCES public.task_spaces(id) ON DELETE CASCADE,
  permission_level public.task_permission_level NOT NULL DEFAULT 'view',
  granted_by uuid REFERENCES public.task_members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_member_id, space_id)
);

CREATE INDEX IF NOT EXISTS idx_task_space_access_member ON public.task_space_access(task_member_id);
CREATE INDEX IF NOT EXISTS idx_task_space_access_space ON public.task_space_access(space_id);
CREATE INDEX IF NOT EXISTS idx_task_members_auth_user_id ON public.task_members(auth_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_space_access TO authenticated;
GRANT ALL ON public.task_space_access TO service_role;
ALTER TABLE public.task_space_access ENABLE ROW LEVEL SECURITY;

-- 4) Backfill de papéis
UPDATE public.task_members SET role = 'admin'
 WHERE id IN ('4d4d4fd2-4039-44df-bd63-94de78b261eb', '6094da1c-72bc-4405-906d-eab0fd3ade1d');
UPDATE public.task_members SET role = 'member'
 WHERE id IN ('59d0ea42-f391-4e77-b2b8-b18a4de3ca9f', '0231eaa7-498e-44e6-8094-df26ddc85040');

-- 5) Funções (específicas de tarefas)
CREATE OR REPLACE FUNCTION public.is_task_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.task_members
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_task_member()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.task_members
    WHERE auth_user_id = auth.uid() AND role IN ('admin', 'member')
  );
$$;

-- Qualquer pessoa com vínculo ativo no módulo de tarefas (inclui convidados)
CREATE OR REPLACE FUNCTION public.is_task_participant()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.task_members
    WHERE auth_user_id = auth.uid() AND role IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.has_task_space_access(p_space_id uuid, p_min_level public.task_permission_level)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.task_space_access tsa
    JOIN public.task_members tm ON tm.id = tsa.task_member_id
    WHERE tm.auth_user_id = auth.uid()
      AND tm.role = 'guest'
      AND tsa.space_id = p_space_id
      AND tsa.permission_level >= p_min_level
  );
$$;

-- Resolvem o espaço subindo a hierarquia
CREATE OR REPLACE FUNCTION public.task_space_of_folder(p_folder_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT space_id FROM public.task_folders WHERE id = p_folder_id;
$$;

CREATE OR REPLACE FUNCTION public.task_space_of_list(p_list_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.space_id FROM public.task_lists l
  JOIN public.task_folders f ON f.id = l.folder_id
  WHERE l.id = p_list_id;
$$;

CREATE OR REPLACE FUNCTION public.task_space_of_task(p_task_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.task_space_of_list(t.list_id) FROM public.tasks t WHERE t.id = p_task_id;
$$;

-- 6) RLS: task_spaces
DROP POLICY IF EXISTS "team members can manage task_spaces" ON public.task_spaces;
CREATE POLICY "task_spaces select" ON public.task_spaces FOR SELECT TO authenticated
  USING (public.is_task_member() OR public.has_task_space_access(id, 'view'));
CREATE POLICY "task_spaces admin insert" ON public.task_spaces FOR INSERT TO authenticated
  WITH CHECK (public.is_task_admin());
CREATE POLICY "task_spaces admin update" ON public.task_spaces FOR UPDATE TO authenticated
  USING (public.is_task_admin()) WITH CHECK (public.is_task_admin());
CREATE POLICY "task_spaces admin delete" ON public.task_spaces FOR DELETE TO authenticated
  USING (public.is_task_admin());

-- 7) RLS: task_folders
DROP POLICY IF EXISTS "team members can manage task_folders" ON public.task_folders;
CREATE POLICY "task_folders select" ON public.task_folders FOR SELECT TO authenticated
  USING (public.is_task_member() OR public.has_task_space_access(space_id, 'view'));
CREATE POLICY "task_folders admin insert" ON public.task_folders FOR INSERT TO authenticated
  WITH CHECK (public.is_task_admin());
CREATE POLICY "task_folders admin update" ON public.task_folders FOR UPDATE TO authenticated
  USING (public.is_task_admin()) WITH CHECK (public.is_task_admin());
CREATE POLICY "task_folders admin delete" ON public.task_folders FOR DELETE TO authenticated
  USING (public.is_task_admin());

-- 8) RLS: task_lists
DROP POLICY IF EXISTS "team members can manage task_lists" ON public.task_lists;
CREATE POLICY "task_lists select" ON public.task_lists FOR SELECT TO authenticated
  USING (
    public.is_task_member()
    OR public.has_task_space_access(public.task_space_of_folder(folder_id), 'view')
  );
CREATE POLICY "task_lists admin insert" ON public.task_lists FOR INSERT TO authenticated
  WITH CHECK (public.is_task_admin());
CREATE POLICY "task_lists admin update" ON public.task_lists FOR UPDATE TO authenticated
  USING (public.is_task_admin()) WITH CHECK (public.is_task_admin());
CREATE POLICY "task_lists admin delete" ON public.task_lists FOR DELETE TO authenticated
  USING (public.is_task_admin());

-- 9) RLS: tasks
DROP POLICY IF EXISTS "Team members can manage tasks" ON public.tasks;
CREATE POLICY "tasks select" ON public.tasks FOR SELECT TO authenticated
  USING (
    public.is_task_member()
    OR (list_id IS NOT NULL AND public.has_task_space_access(public.task_space_of_list(list_id), 'view'))
  );
CREATE POLICY "tasks insert" ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (
    public.is_task_member()
    OR (list_id IS NOT NULL AND public.has_task_space_access(public.task_space_of_list(list_id), 'edit'))
  );
CREATE POLICY "tasks update" ON public.tasks FOR UPDATE TO authenticated
  USING (
    public.is_task_member()
    OR (list_id IS NOT NULL AND public.has_task_space_access(public.task_space_of_list(list_id), 'edit'))
  )
  WITH CHECK (
    public.is_task_member()
    OR (list_id IS NOT NULL AND public.has_task_space_access(public.task_space_of_list(list_id), 'edit'))
  );
CREATE POLICY "tasks delete" ON public.tasks FOR DELETE TO authenticated
  USING (
    public.is_task_member()
    OR (list_id IS NOT NULL AND public.has_task_space_access(public.task_space_of_list(list_id), 'edit'))
  );

-- 10) RLS: task_comments
DROP POLICY IF EXISTS "Team members can read comments" ON public.task_comments;
DROP POLICY IF EXISTS "Team members can create comments" ON public.task_comments;
DROP POLICY IF EXISTS "Authors can update own comments" ON public.task_comments;
DROP POLICY IF EXISTS "Authors or admins can delete comments" ON public.task_comments;

CREATE POLICY "task_comments select" ON public.task_comments FOR SELECT TO authenticated
  USING (
    public.is_task_member()
    OR public.has_task_space_access(public.task_space_of_task(task_id), 'view')
  );
CREATE POLICY "task_comments insert" ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      public.is_task_member()
      OR public.has_task_space_access(public.task_space_of_task(task_id), 'comment')
    )
  );
CREATE POLICY "task_comments update own" ON public.task_comments FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "task_comments delete" ON public.task_comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.is_task_admin());

-- 11) RLS: task_members
DROP POLICY IF EXISTS "team members can manage task_members" ON public.task_members;
CREATE POLICY "task_members select" ON public.task_members FOR SELECT TO authenticated
  USING (public.is_task_participant());
CREATE POLICY "task_members admin insert" ON public.task_members FOR INSERT TO authenticated
  WITH CHECK (public.is_task_admin());
CREATE POLICY "task_members admin update" ON public.task_members FOR UPDATE TO authenticated
  USING (public.is_task_admin()) WITH CHECK (public.is_task_admin());
CREATE POLICY "task_members admin delete" ON public.task_members FOR DELETE TO authenticated
  USING (public.is_task_admin());

-- 12) RLS: task_views
DROP POLICY IF EXISTS "select task_views" ON public.task_views;
DROP POLICY IF EXISTS "insert task_views" ON public.task_views;
DROP POLICY IF EXISTS "update task_views" ON public.task_views;
DROP POLICY IF EXISTS "delete task_views" ON public.task_views;

CREATE POLICY "task_views select" ON public.task_views FOR SELECT TO authenticated
  USING (
    public.is_task_participant()
    AND (
      is_private = false
      OR owner_id IN (SELECT id FROM public.task_members WHERE auth_user_id = auth.uid())
    )
  );
CREATE POLICY "task_views admin insert" ON public.task_views FOR INSERT TO authenticated
  WITH CHECK (public.is_task_admin());
CREATE POLICY "task_views admin update" ON public.task_views FOR UPDATE TO authenticated
  USING (public.is_task_admin()) WITH CHECK (public.is_task_admin());
CREATE POLICY "task_views admin delete" ON public.task_views FOR DELETE TO authenticated
  USING (public.is_task_admin());

-- 13) RLS: task_space_access (só admins de tarefas gerenciam; o próprio convidado pode ler o seu)
CREATE POLICY "task_space_access select" ON public.task_space_access FOR SELECT TO authenticated
  USING (
    public.is_task_member()
    OR task_member_id IN (SELECT id FROM public.task_members WHERE auth_user_id = auth.uid())
  );
CREATE POLICY "task_space_access admin insert" ON public.task_space_access FOR INSERT TO authenticated
  WITH CHECK (public.is_task_admin());
CREATE POLICY "task_space_access admin update" ON public.task_space_access FOR UPDATE TO authenticated
  USING (public.is_task_admin()) WITH CHECK (public.is_task_admin());
CREATE POLICY "task_space_access admin delete" ON public.task_space_access FOR DELETE TO authenticated
  USING (public.is_task_admin());

-- 14) leads / client_task_lists: desacoplar do app principal mantendo acesso atual
DROP POLICY IF EXISTS "Team members can manage leads" ON public.leads;
CREATE POLICY "leads task members" ON public.leads FOR ALL TO authenticated
  USING (public.is_task_member()) WITH CHECK (public.is_task_member());

DROP POLICY IF EXISTS "Team members can manage client task lists" ON public.client_task_lists;
CREATE POLICY "client_task_lists task members" ON public.client_task_lists FOR ALL TO authenticated
  USING (public.is_task_member() OR public.is_team_member())
  WITH CHECK (public.is_task_member() OR public.is_team_member());
