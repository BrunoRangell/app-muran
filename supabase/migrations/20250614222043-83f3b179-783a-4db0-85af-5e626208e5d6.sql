
-- Renovação manual dos tokens do Google Ads via SQL
-- Esta query chama a edge function google-ads-token-check para forçar a renovação

DO $$
DECLARE
    response_status INTEGER;
    response_content TEXT;
    log_id UUID;
BEGIN
    -- Criar log da tentativa de renovação manual
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
        'token_renewal', 
        'Renovação manual dos tokens do Google Ads iniciada via SQL', 
        jsonb_build_object(
            'timestamp', now(),
            'source', 'manual_sql',
            'initiated_by', 'admin'
        )
    )
    RETURNING id INTO log_id;

    -- Registrar início da operação
    INSERT INTO public.google_ads_token_metadata (token_type, status, details)
    VALUES (
        'access_token',
        'renewing',
        jsonb_build_object(
            'renewal_type', 'manual_sql',
            'timestamp', now(),
            'log_id', log_id
        )
    );

    -- Chamar a edge function para renovar os tokens
    SELECT status, content::TEXT INTO response_status, response_content
    FROM net.http_post(
        url := 'https://socrnutfpqtcjmetskta.supabase.co/functions/v1/google-ads-token-check',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
        body := '{"manual": true, "source": "sql_renewal"}'::jsonb
    );

    -- Registrar o resultado da chamada
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
        'token_renewal', 
        'Resposta da edge function recebida', 
        jsonb_build_object(
            'timestamp', now(),
            'source', 'manual_sql',
            'response_status', response_status,
            'response_content', response_content,
            'log_id', log_id
        )
    );

    -- Verificar se a renovação foi bem-sucedida
    IF response_status BETWEEN 200 AND 299 THEN
        RAISE NOTICE 'Renovação de tokens concluída com sucesso! Status: %', response_status;
        RAISE NOTICE 'Resposta: %', response_content;
        
        -- Atualizar o status para sucesso
        INSERT INTO public.google_ads_token_metadata (token_type, status, details)
        VALUES (
            'access_token',
            'renewed_successfully',
            jsonb_build_object(
                'renewal_type', 'manual_sql',
                'timestamp', now(),
                'response_status', response_status,
                'log_id', log_id
            )
        );
        
    ELSE
        RAISE NOTICE 'Erro na renovação de tokens! Status: %', response_status;
        RAISE NOTICE 'Resposta de erro: %', response_content;
        
        -- Atualizar o status para erro
        INSERT INTO public.google_ads_token_metadata (token_type, status, details)
        VALUES (
            'access_token',
            'renewal_failed',
            jsonb_build_object(
                'renewal_type', 'manual_sql',
                'timestamp', now(),
                'response_status', response_status,
                'error_content', response_content,
                'log_id', log_id
            )
        );
    END IF;

EXCEPTION WHEN OTHERS THEN
    -- Capturar qualquer erro durante o processo
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
        'token_renewal', 
        'Erro durante renovação manual de tokens', 
        jsonb_build_object(
            'timestamp', now(),
            'source', 'manual_sql',
            'error', SQLERRM,
            'error_code', SQLSTATE,
            'log_id', log_id
        )
    );
    
    RAISE NOTICE 'Erro durante renovação: %', SQLERRM;
END $$;

-- Verificar o status atual dos tokens após a renovação
SELECT 
    name as token_name,
    LEFT(value, 50) || '...' as token_preview,
    updated_at
FROM public.api_tokens 
WHERE name IN ('google_ads_access_token', 'google_ads_refresh_token')
ORDER BY updated_at DESC;

-- Verificar os logs mais recentes da renovação
SELECT 
    event_type,
    message,
    details,
    created_at
FROM public.system_logs 
WHERE event_type = 'token_renewal'
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar o metadata dos tokens
SELECT 
    token_type,
    status,
    details,
    created_at
FROM public.google_ads_token_metadata
ORDER BY created_at DESC 
LIMIT 3;
