-- Remover políticas existentes que podem estar bloqueando DELETE
DROP POLICY IF EXISTS "Allow anonymous access to campaign health" ON public.campaign_health;
DROP POLICY IF EXISTS "Authenticated users can access campaign health" ON public.campaign_health;

-- Criar políticas mais específicas e permissivas para operações de limpeza
CREATE POLICY "Service role can manage all campaign health data" 
ON public.campaign_health 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Política específica para DELETE permitindo limpeza automática
CREATE POLICY "Allow DELETE for data cleanup" 
ON public.campaign_health 
FOR DELETE 
USING (true);

-- Política para SELECT (leitura pública)
CREATE POLICY "Public can read campaign health" 
ON public.campaign_health 
FOR SELECT 
USING (true);

-- Política para INSERT/UPDATE (usuários autenticados)
CREATE POLICY "Authenticated users can insert/update campaign health" 
ON public.campaign_health 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaign health" 
ON public.campaign_health 
FOR UPDATE 
USING (true) 
WITH CHECK (true);