-- Criar tabela de datas importantes
CREATE TABLE public.important_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento flexível
  entity_type text NOT NULL CHECK (entity_type IN ('client', 'team', 'custom')),
  entity_id uuid, -- NULL para datas customizadas sem vínculo
  
  -- Informações da data
  date_type text NOT NULL,
  title text NOT NULL,
  description text,
  date date NOT NULL,
  
  -- Controle de recorrência
  is_recurring boolean DEFAULT false,
  recurrence_pattern text,
  
  -- Metadados
  icon text,
  color text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.important_dates ENABLE ROW LEVEL SECURITY;

-- Policy para team members
CREATE POLICY "Team members can manage important dates"
  ON public.important_dates
  FOR ALL
  USING (is_team_member())
  WITH CHECK (is_team_member());

-- Índices para performance
CREATE INDEX idx_important_dates_entity ON public.important_dates(entity_type, entity_id);
CREATE INDEX idx_important_dates_date ON public.important_dates(date);
CREATE INDEX idx_important_dates_type ON public.important_dates(date_type);

-- Trigger para updated_at
CREATE TRIGGER update_important_dates_updated_at
  BEFORE UPDATE ON public.important_dates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp_column();