-- Limpar revisões antigas de Meta Ads (anteriores a hoje)
DELETE FROM budget_reviews 
WHERE platform = 'meta' 
AND review_date < CURRENT_DATE;

-- Registrar limpeza no log do sistema
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'cleanup_executed',
  'Limpeza manual de revisões antigas do Meta Ads executada',
  jsonb_build_object(
    'platform', 'meta',
    'date_threshold', CURRENT_DATE,
    'reason', 'Implementação de limpeza automática - remover acúmulo histórico',
    'executed_at', now(),
    'context', 'Sistema configurado para manter apenas revisões do dia atual'
  )
);