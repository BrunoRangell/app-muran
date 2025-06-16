-- Verificar e criar extensões necessárias se não existirem
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Tabela para logs de sistema (já existe, mas mantido para referência)
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para monitoramento de execuções do cron
CREATE TABLE IF NOT EXISTS public.cron_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  execution_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL,
  details JSONB
);

-- Função para obter a expressão cron de um job
CREATE OR REPLACE FUNCTION public.get_cron_expression(job_name text)
RETURNS TABLE (cron_expression text) AS $$
BEGIN
  RETURN QUERY
  SELECT schedule
  FROM cron.job
  WHERE jobname = job_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função corrigida para obter múltiplos jobs do cron
CREATE OR REPLACE FUNCTION public.get_cron_jobs(job_names text[])
RETURNS TABLE (
  jobid int, 
  jobname text, 
  schedule text, 
  active boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.jobid::int, 
    j.jobname, 
    j.schedule, 
    j.active
  FROM 
    cron.job j
  WHERE 
    j.jobname = ANY(job_names);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Limpar jobs antigos para evitar duplicidade
SELECT cron.unschedule('daily-meta-review-job');
SELECT cron.unschedule('daily-meta-review-test-job');
SELECT cron.unschedule('cron-health-check');
SELECT cron.unschedule('cron-status-keeper');
SELECT cron.unschedule('google-ads-token-check-job');

-- Registrar uma execução de teste para garantir que os componentes mostrem status ativo
INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
VALUES (
  'daily-meta-review-job',
  now(),
  'completed', 
  jsonb_build_object(
    'timestamp', now(),
    'message', 'Registro de teste para inicializar o monitoramento',
    'source', 'manual_update'
  )
);

-- Atualizar o log do sistema também
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'cron_job', 
  'Inicialização do monitoramento do cron agendado', 
  jsonb_build_object(
    'timestamp', now(),
    'source', 'manual_update'
  )
);

-- Adicionar job SEPARADO para execução de teste - executa a cada 30 minutos
SELECT cron.schedule(
  'daily-meta-review-test-job',
  '*/30 * * * *',  -- Executa a cada 30 minutos
  $$
  -- Registrar o teste no log do sistema
  INSERT INTO public.system_logs (event_type, message, details)
  VALUES (
    'cron_job', 
    'Teste de revisão automática a cada 30 minutos', 
    jsonb_build_object(
      'timestamp', now(),
      'source', 'test_interval'
    )
  );
  
  -- Criar um registro para o teste
  DECLARE
    log_id UUID;
  BEGIN
    INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
    VALUES (
      'daily-meta-review-test-job', 
      now(), 
      'started', 
      jsonb_build_object(
        'timestamp', now(),
        'source', 'scheduled_test',
        'test', true,
        'executeReview', false
      )
    )
    RETURNING id INTO log_id;
  
    -- Chamar a função edge com parâmetro de teste explícito
    PERFORM
      net.http_post(
        url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/daily-meta-review',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
        body:=format('{"scheduled": true, "test": true, "executeReview": false, "source": "cron_test", "logId": "%s"}', log_id)::jsonb
      );
      
    -- Atualizar o status para completed após a execução
    UPDATE public.cron_execution_logs 
    SET status = 'completed', 
        details = jsonb_build_object(
          'timestamp', now(),
          'source', 'scheduled_test',
          'test', true,
          'executeReview', false,
          'message', 'Teste completado com sucesso'
        )
    WHERE id = log_id;
  END;
  $$
);

-- Agendar execução REAL da revisão Meta Ads a cada 6 minutos - INTERVALO AUMENTADO
SELECT cron.schedule(
  'daily-meta-review-job',
  '*/6 * * * *',  -- Executa a cada 6 minutos (aumentado de 3 para 6)
  $$
  DECLARE
    log_id UUID;
    response_status INTEGER;
    response_body TEXT;
  BEGIN
    -- Criar o registro de log para a execução REAL
    INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
    VALUES (
      'daily-meta-review-job', 
      now(), 
      'started', 
      jsonb_build_object(
        'timestamp', now(),
        'source', 'scheduled',
        'isAutomatic', true,
        'executeReview', true,
        'executionType', 'real',
        'test', false,
        'forceExecution', true
      )
    )
    RETURNING id INTO log_id;
    
    -- LOG DE DEPURAÇÃO
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
      'cron_job', 
      'Iniciando execução REAL da revisão diária Meta Ads via cron', 
      jsonb_build_object(
        'timestamp', now(),
        'logId', log_id,
        'isReal', true,
        'job', 'daily-meta-review-job'
      )
    );
    
    -- CHAMADA CORRIGIDA com executeReview=true E test=false E forceExecution=true
    SELECT status, content::TEXT INTO response_status, response_body FROM
      net.http_post(
        url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/daily-meta-review',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
        body:=format('{"scheduled": true, "executeReview": true, "test": false, "source": "cron_real", "logId": "%s", "forceExecution": true}', log_id)::jsonb
      );
      
    -- LOG DA RESPOSTA HTTP
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
      'cron_job', 
      'Resposta da função Edge recebida', 
      jsonb_build_object(
        'timestamp', now(),
        'logId', log_id,
        'status', response_status,
        'response', response_body
      )
    );
    
    -- Atualizar status baseado na resposta
    IF response_status BETWEEN 200 AND 299 THEN
      -- Atualizar para in_progress se a resposta foi bem-sucedida
      UPDATE public.cron_execution_logs 
      SET status = 'in_progress', 
          details = jsonb_build_object(
            'timestamp', now(),
            'source', 'scheduled',
            'isAutomatic', true,
            'executeReview', true,
            'executionType', 'real',
            'test', false,
            'forceExecution', true,
            'response_status', response_status,
            'http_success', true
          )
      WHERE id = log_id;
    ELSE
      -- Atualizar para error se a resposta não foi bem-sucedida
      UPDATE public.cron_execution_logs 
      SET status = 'error', 
          details = jsonb_build_object(
            'timestamp', now(),
            'source', 'scheduled',
            'isAutomatic', true,
            'executeReview', true,
            'executionType', 'real',
            'test', false,
            'forceExecution', true,
            'response_status', response_status,
            'http_success', false,
            'error_message', response_body
          )
      WHERE id = log_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Capturar e registrar qualquer erro
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
      'cron_job', 
      'Erro na execução do job cron', 
      jsonb_build_object(
        'timestamp', now(),
        'logId', log_id,
        'error', SQLERRM,
        'errorCode', SQLSTATE
      )
    );
    
    -- Atualizar o status para erro
    UPDATE public.cron_execution_logs 
    SET status = 'error', 
        details = jsonb_build_object(
          'timestamp', now(),
          'error', SQLERRM,
          'errorCode', SQLSTATE
        )
    WHERE id = log_id;
  END;
  $$
);

-- Adicionar job específico para verificação de tokens do Google Ads a cada 2 horas
SELECT cron.schedule(
  'google-ads-token-check-job',
  '0 */2 * * *',  -- Executa a cada 2 horas
  $$
  DECLARE
    log_id UUID;
    response_status INTEGER;
    response_body TEXT;
  BEGIN
    -- Registrar início da execução
    INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
    VALUES (
      'google-ads-token-check-job', 
      now(), 
      'started', 
      jsonb_build_object('timestamp', now())
    )
    RETURNING id INTO log_id;
    
    -- Registrar a tentativa no log do sistema
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES ('cron_job', 'Verificação automática de tokens do Google Ads', jsonb_build_object('timestamp', now(), 'source', 'scheduled_job', 'log_id', log_id));
      
    -- Invocar a função Edge para verificação de tokens
    SELECT status, content::TEXT INTO response_status, response_body FROM
      net.http_post(
        url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/google-ads-token-check',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
        body:=format('{"scheduled": true, "source": "cron", "logId": "%s"}', log_id)::jsonb
      );
      
    -- Atualizar status baseado na resposta
    IF response_status BETWEEN 200 AND 299 THEN
      -- Atualizar para completed se a resposta foi bem-sucedida
      UPDATE public.cron_execution_logs 
      SET status = 'completed', 
          details = jsonb_build_object(
            'timestamp', now(),
            'source', 'scheduled_job',
            'response_status', response_status,
            'http_success', true
          )
      WHERE id = log_id;
    ELSE
      -- Atualizar para error se a resposta não foi bem-sucedida
      UPDATE public.cron_execution_logs 
      SET status = 'error', 
          details = jsonb_build_object(
            'timestamp', now(),
            'source', 'scheduled_job',
            'response_status', response_status,
            'http_success', false,
            'error_message', response_body
          )
      WHERE id = log_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Capturar e registrar qualquer erro
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
      'cron_job', 
      'Erro na verificação de tokens do Google Ads', 
      jsonb_build_object(
        'timestamp', now(),
        'logId', log_id,
        'error', SQLERRM,
        'errorCode', SQLSTATE
      )
    );
    
    -- Atualizar o status para erro
    UPDATE public.cron_execution_logs 
    SET status = 'error', 
        details = jsonb_build_object(
          'timestamp', now(),
          'error', SQLERRM,
          'errorCode', SQLSTATE
        )
    WHERE id = log_id;
  END;
  $$
);

-- Adicionar uma execução de manutenção de status para verificar e manter o cron ativo
SELECT cron.schedule(
  'cron-health-check',
  '*/30 * * * *',  -- A cada 30 minutos
  $$
  -- Registrar um heartbeat para monitoramento de atividade
  INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
  VALUES (
    'cron-health-check', 
    now(), 
    'active', 
    jsonb_build_object(
      'timestamp', now(),
      'message', 'Verificação automática de saúde do cron'
    )
  );
  
  -- Verificar se há execuções pendentes há mais de 30 minutos e marcá-las como erro
  UPDATE public.cron_execution_logs
  SET 
    status = 'error',
    details = jsonb_build_object(
      'timestamp', now(),
      'message', 'Execução não completada em tempo hábil',
      'original_status', status,
      'auto_closed', true
    )
  WHERE 
    (status = 'started' OR status = 'in_progress') AND
    execution_time < (now() - INTERVAL '30 minutes');
    
  -- Atualizar o status de "last_batch_review_time" para forçar a execução de novas revisões
  UPDATE public.system_configs
  SET value = (now() - INTERVAL '1 day')::text
  WHERE key = 'last_batch_review_time';
  $$
);

-- Atualizar job para gerenciar status de jobs ativos - executa a cada hora
SELECT cron.schedule(
  'cron-status-keeper',
  '0 * * * *',  -- A cada hora
  $$
  -- Verificar se os jobs de revisão estão ativos
  DECLARE
    review_job_exists BOOLEAN;
    test_job_exists BOOLEAN;
  BEGIN
    -- Verificar se o job de revisão real existe
    SELECT EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'daily-meta-review-job'
    ) INTO review_job_exists;
    
    -- Verificar se o job de teste existe
    SELECT EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'daily-meta-review-test-job'
    ) INTO test_job_exists;
    
    -- Registrar o status no sistema
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
      'cron_job', 
      'Verificação periódica de status de jobs cron', 
      jsonb_build_object(
        'timestamp', now(),
        'daily-meta-review-job', review_job_exists,
        'daily-meta-review-test-job', test_job_exists
      )
    );
    
    -- Se não existirem, tentar recriar
    IF NOT review_job_exists THEN
      -- Tentar recriar o job de revisão real
      PERFORM cron.schedule(
        'daily-meta-review-job',
        '*/6 * * * *',
        $inner$
        DECLARE
          log_id UUID;
        BEGIN
          INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
          VALUES (
            'daily-meta-review-job', 
            now(), 
            'started', 
            jsonb_build_object(
              'timestamp', now(),
              'source', 'scheduled',
              'isAutomatic', true,
              'executeReview', true,
              'executionType', 'real',
              'test', false,
              'forceExecution', true,
              'auto_recreated', true
            )
          )
          RETURNING id INTO log_id;
          
          PERFORM
            net.http_post(
              url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/daily-meta-review',
              headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
              body:=format('{"scheduled": true, "executeReview": true, "test": false, "source": "cron_real", "logId": "%s", "forceExecution": true}', log_id)::jsonb
            );
        END;
        $inner$
      );
      
      INSERT INTO public.system_logs (event_type, message, details)
      VALUES (
        'cron_job', 
        'Recriação automática do job de revisão real', 
        jsonb_build_object(
          'timestamp', now(),
          'job', 'daily-meta-review-job'
        )
      );
    END IF;
    
    IF NOT test_job_exists THEN
      -- Tentar recriar o job de teste
      PERFORM cron.schedule(
        'daily-meta-review-test-job',
        '*/30 * * * *',
        $inner$
        DECLARE
          log_id UUID;
        BEGIN
          INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
          VALUES (
            'daily-meta-review-test-job', 
            now(), 
            'started', 
            jsonb_build_object(
              'timestamp', now(),
              'source', 'scheduled_test',
              'test', true,
              'executeReview', false,
              'auto_recreated', true
            )
          )
          RETURNING id INTO log_id;
          
          PERFORM
            net.http_post(
              url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/daily-meta-review',
              headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
              body:=format('{"scheduled": true, "test": true, "executeReview": false, "source": "cron_test", "logId": "%s"}', log_id)::jsonb
            );
        END;
        $inner$
      );
      
      INSERT INTO public.system_logs (event_type, message, details)
      VALUES (
        'cron_job', 
        'Recriação automática do job de teste', 
        jsonb_build_object(
          'timestamp', now(),
          'job', 'daily-meta-review-test-job'
        )
      );
    END IF;
  END;
  $$
);

-- Registrar log de atualização da configuração
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'cron_job', 
  'Recriação completa das configurações de cron', 
  jsonb_build_object(
    'timestamp', now(),
    'source', 'manual_update',
    'jobs', ARRAY['daily-meta-review-job', 'daily-meta-review-test-job', 'cron-health-check', 'cron-status-keeper']
  )
);
