-- Criar tabela para logs de revisões em lote
CREATE TABLE IF NOT EXISTS public.batch_review_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    platform TEXT NOT NULL CHECK (platform IN ('meta', 'google')),
    total_clients INTEGER NOT NULL,
    success_count INTEGER NOT NULL,
    error_count INTEGER NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    global_updates_performed BOOLEAN DEFAULT FALSE,
    review_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar comentários para documentação
COMMENT ON TABLE public.batch_review_logs IS 'Registra execuções de revisões em lote do sistema unificado';
COMMENT ON COLUMN public.batch_review_logs.platform IS 'Plataforma da revisão: meta ou google';
COMMENT ON COLUMN public.batch_review_logs.total_clients IS 'Total de clientes processados';
COMMENT ON COLUMN public.batch_review_logs.success_count IS 'Número de sucessos';
COMMENT ON COLUMN public.batch_review_logs.error_count IS 'Número de falhas';
COMMENT ON COLUMN public.batch_review_logs.execution_time_ms IS 'Tempo total de execução em milissegundos';
COMMENT ON COLUMN public.batch_review_logs.global_updates_performed IS 'Se atualizações globais foram executadas';
COMMENT ON COLUMN public.batch_review_logs.review_date IS 'Data da revisão processada';

-- Habilitar RLS
ALTER TABLE public.batch_review_logs ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Team members can view batch review logs"
    ON public.batch_review_logs
    FOR SELECT
    USING (is_team_member());

CREATE POLICY "Team members can insert batch review logs"
    ON public.batch_review_logs
    FOR INSERT
    WITH CHECK (is_team_member());

-- Criar índices para performance
CREATE INDEX idx_batch_review_logs_platform_date ON public.batch_review_logs (platform, review_date);
CREATE INDEX idx_batch_review_logs_created_at ON public.batch_review_logs (created_at DESC);

-- Trigger para atualização automática do updated_at
CREATE TRIGGER update_batch_review_logs_updated_at
    BEFORE UPDATE ON public.batch_review_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();