-- Criar função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION public.trigger_convert_meta_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  -- Apenas dispara se for o token do Meta
  IF NEW.name = 'meta_access_token' AND (OLD.value IS DISTINCT FROM NEW.value) THEN
    -- Chamar a edge function via http
    PERFORM net.http_post(
      url := 'https://socrnutfpqtcjmetskta.supabase.co/functions/v1/convert-meta-token',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
      body := '{}'::jsonb
    );
    
    -- Log da chamada
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
      'meta_token_trigger',
      'Trigger disparado para conversão automática de token Meta',
      jsonb_build_object('token_updated_at', NOW())
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar o trigger na tabela api_tokens
DROP TRIGGER IF EXISTS on_meta_token_update ON public.api_tokens;

CREATE TRIGGER on_meta_token_update
  AFTER UPDATE ON public.api_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_convert_meta_token();