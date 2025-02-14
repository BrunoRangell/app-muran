
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
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        try {
          const value = localStorage.getItem(key);
          console.log('Recuperando dado da storage:', { key, value });
          return value;
        } catch (error) {
          console.error('Erro ao recuperar dado da storage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          console.log('Salvando dado na storage:', { key, value });
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Erro ao salvar dado na storage:', error);
        }
      },
      removeItem: (key) => {
        try {
          console.log('Removendo dado da storage:', key);
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Erro ao remover dado da storage:', error);
        }
      },
    },
  },
});

// Função para verificar o estado da sessão
export const checkSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar sessão:', error);
      return false;
    }

    return !!session;
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    return false;
  }
};

// Configurar listener para mudanças de autenticação
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Evento de autenticação:', event);
  console.log('Sessão atual:', session);

  // Se o usuário foi desconectado
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    console.log('Usuário desconectado, limpando storage e redirecionando');
    localStorage.clear();
    window.location.href = '/login';
    return;
  }

  // Se a sessão expirou
  if (event === 'TOKEN_REFRESHED' && !session) {
    console.log('Sessão expirada, redirecionando para login');
    localStorage.clear();
    window.location.href = '/login';
    return;
  }
  
  // Se o usuário se conectou
  if (event === 'SIGNED_IN') {
    console.log('Usuário conectado, verificando storage');
    const authData = localStorage.getItem('muran-auth-token');
    if (!authData) {
      console.warn('Token não encontrado na storage após login');
      localStorage.clear();
      window.location.href = '/login';
    }
  }
});

// Verificar sessão periodicamente
setInterval(async () => {
  const isSessionValid = await checkSession();
  if (!isSessionValid && window.location.pathname !== '/login') {
    console.log('Sessão inválida detectada, redirecionando para login');
    localStorage.clear();
    window.location.href = '/login';
  }
}, 60000); // Verifica a cada minuto

