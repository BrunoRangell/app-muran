CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_leads_assignee_id ON public.leads(assignee_id);
CREATE INDEX IF NOT EXISTS idx_task_views_owner_id ON public.task_views(owner_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.task_members(id) ON DELETE SET NULL;

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_assignee_id_fkey;
ALTER TABLE public.leads ADD CONSTRAINT leads_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.task_members(id) ON DELETE SET NULL;

ALTER TABLE public.task_views DROP CONSTRAINT IF EXISTS task_views_owner_id_fkey;
ALTER TABLE public.task_views ADD CONSTRAINT task_views_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.task_members(id) ON DELETE SET NULL;