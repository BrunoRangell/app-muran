
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. ' +
    'Por favor, configure-as no arquivo .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'muran-auth-token',
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Configurar listener para mudanças de autenticação
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Evento de autenticação:', event);
  console.log('Sessão atual:', session);

  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    // Limpar cache do React Query ou realizar outras ações necessárias
    console.log('Sessão atualizada ou usuário desconectado');
  }
});
