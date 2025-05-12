
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.5.0';

// Inicializar cliente Supabase para a Edge Function
export const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidas');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};
