
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Obter credenciais do ambiente
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Função para obter cliente Supabase
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Credenciais Supabase não configuradas");
  }
  
  return createClient(supabaseUrl, supabaseKey);
}
