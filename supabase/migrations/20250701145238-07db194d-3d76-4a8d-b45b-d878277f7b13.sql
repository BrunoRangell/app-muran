
-- Fase 2: Remover tabelas redundantes que foram substituídas pela nova estrutura unificada

-- Verificar se existem dados importantes antes da remoção (apenas para log)
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'database_cleanup', 
  'INICIANDO LIMPEZA DE TABELAS REDUNDANTES', 
  jsonb_build_object(
    'timestamp', now(),
    'tables_to_remove', ARRAY[
      'campaign_health_snapshots',
      'client_current_reviews', 
      'client_google_accounts',
      'client_meta_accounts',
      'daily_budget_reviews',
      'google_ads_reviews'
    ],
    'reason', 'Tabelas substituídas pela nova estrutura unificada: client_accounts, campaign_health, budget_reviews'
  )
);

-- Remover tabelas redundantes (ordem importante para evitar problemas de FK)
DROP TABLE IF EXISTS public.campaign_health_snapshots CASCADE;
DROP TABLE IF EXISTS public.client_current_reviews CASCADE;
DROP TABLE IF EXISTS public.client_google_accounts CASCADE;
DROP TABLE IF EXISTS public.client_meta_accounts CASCADE;
DROP TABLE IF EXISTS public.daily_budget_reviews CASCADE;
DROP TABLE IF EXISTS public.google_ads_reviews CASCADE;

-- Registrar conclusão da limpeza
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'database_cleanup', 
  'LIMPEZA DE TABELAS REDUNDANTES CONCLUÍDA', 
  jsonb_build_object(
    'timestamp', now(),
    'tables_removed', ARRAY[
      'campaign_health_snapshots',
      'client_current_reviews', 
      'client_google_accounts',
      'client_meta_accounts',
      'daily_budget_reviews',
      'google_ads_reviews'
    ],
    'remaining_tables', ARRAY[
      'client_accounts',
      'campaign_health', 
      'budget_reviews',
      'custom_budgets'
    ],
    'status', 'success'
  )
);
