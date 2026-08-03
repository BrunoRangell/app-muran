-- ENUMS
CREATE TYPE public.task_status AS ENUM ('pendente','fazendo','em_aprovacao','ajuste','concluido');
CREATE TYPE public.task_priority AS ENUM ('baixa','normal','alta','urgente');
CREATE TYPE public.task_internal_area AS ENUM ('Operacional','Financeiro','Administrativo');
CREATE TYPE public.lead_status AS ENUM ('novo_lead','contato_iniciado','qualificacao','reuniao_agendada','proposta_enviada','negociacao','follow_up','aguardando_documentos','fechamento','ganho','perdido');

-- CLIENT TASK LISTS
CREATE TABLE public.client_task_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_task_lists TO authenticated;
GRANT ALL ON public.client_task_lists TO service_role;
ALTER TABLE public.client_task_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can manage client task lists" ON public.client_task_lists
  FOR ALL TO authenticated USING (public.is_team_member()) WITH CHECK (public.is_team_member());

-- TASKS
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES public.client_task_lists(id) ON DELETE CASCADE,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  internal_area public.task_internal_area,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'pendente',
  assignee_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  due_date DATE,
  priority public.task_priority,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can manage tasks" ON public.tasks
  FOR ALL TO authenticated USING (public.is_team_member()) WITH CHECK (public.is_team_member());
CREATE INDEX idx_tasks_list_id ON public.tasks(list_id);
CREATE INDEX idx_tasks_internal ON public.tasks(is_internal, internal_area);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();

-- Validação: internas sem lista, de cliente com lista
CREATE OR REPLACE FUNCTION public.validate_task_scope()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_internal THEN
    NEW.list_id := NULL;
    IF NEW.internal_area IS NULL THEN
      RAISE EXCEPTION 'Tarefa interna precisa de internal_area';
    END IF;
  ELSE
    NEW.internal_area := NULL;
    IF NEW.list_id IS NULL THEN
      RAISE EXCEPTION 'Tarefa de cliente precisa de list_id';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_task_scope_trigger BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.validate_task_scope();

-- TASK COMMENTS
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL DEFAULT auth.uid(),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_comments TO authenticated;
GRANT ALL ON public.task_comments TO service_role;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can read comments" ON public.task_comments
  FOR SELECT TO authenticated USING (public.is_team_member());
CREATE POLICY "Team members can create comments" ON public.task_comments
  FOR INSERT TO authenticated WITH CHECK (public.is_team_member() AND author_id = auth.uid());
CREATE POLICY "Authors can update own comments" ON public.task_comments
  FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors or admins can delete comments" ON public.task_comments
  FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.is_admin());
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);

-- LEADS
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  contact_info TEXT,
  status public.lead_status NOT NULL DEFAULT 'novo_lead',
  assignee_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  notes TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can manage leads" ON public.leads
  FOR ALL TO authenticated USING (public.is_team_member()) WITH CHECK (public.is_team_member());
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();

-- AUTO-CRIAÇÃO DAS 5 LISTAS POR CLIENTE
CREATE OR REPLACE FUNCTION public.create_default_client_task_lists()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.client_task_lists (client_id, name, position)
  VALUES
    (NEW.id, 'Onboarding', 1),
    (NEW.id, 'Relacionamento', 2),
    (NEW.id, 'Mídia paga', 3),
    (NEW.id, 'Criação', 4),
    (NEW.id, 'Desenvolvimento WEB', 5)
  ON CONFLICT (client_id, name) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER create_client_task_lists_trigger AFTER INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.create_default_client_task_lists();

-- Backfill para clientes existentes
INSERT INTO public.client_task_lists (client_id, name, position)
SELECT c.id, l.name, l.position
FROM public.clients c
CROSS JOIN (VALUES ('Onboarding',1),('Relacionamento',2),('Mídia paga',3),('Criação',4),('Desenvolvimento WEB',5)) AS l(name, position)
ON CONFLICT (client_id, name) DO NOTHING;