
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
    storage: {
      getItem: (key) => {
        const value = localStorage.getItem(key);
        console.log('Recuperando dado da storage:', { key, value });
        return value;
      },
      setItem: (key, value) => {
        console.log('Salvando dado na storage:', { key, value });
        localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        console.log('Removendo dado da storage:', key);
        localStorage.removeItem(key);
      },
    },
    storageKey: 'muran-auth-token',
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

// Configurar listener para mudanças de autenticação
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Evento de autenticação:', event);
  console.log('Sessão atual:', session);

  if (event === 'SIGNED_OUT') {
    console.log('Usuário desconectado, limpando storage');
    localStorage.removeItem('muran-auth-token');
  }
  
  if (event === 'SIGNED_IN') {
    console.log('Usuário conectado, verificando storage');
    const authData = localStorage.getItem('muran-auth-token');
    if (!authData) {
      console.warn('Token não encontrado na storage após login');
    }
  }
});
