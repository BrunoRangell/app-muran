
import { createClient } from '@supabase/supabase-js';
import { errorMessages, AppError } from './errors';

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
          console.log('Recuperando dado da storage:', { key });
          return value;
        } catch (error) {
          console.error('Erro ao recuperar dado da storage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          console.log('Salvando dado na storage:', { key });
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Erro ao salvar dado da storage:', error);
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

// Função centralizada para verificar o estado da sessão
export const checkSession = async () => {
  try {
    console.log('Verificando sessão...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar sessão:', error);
      throw new AppError(errorMessages.AUTH_EXPIRED, 'AUTH_EXPIRED');
    }

    if (!session) {
      console.warn('Sessão não encontrada');
      return false;
    }

    // Verificar se o token está próximo de expirar (60 minutos)
    const expiresAt = new Date(session.expires_at! * 1000);
    const sixtyMinutes = 60 * 60 * 1000;
    
    if (expiresAt.getTime() - Date.now() < sixtyMinutes) {
      console.log('Sessão próxima de expirar, renovando preventivamente...');
      try {
        await supabase.auth.refreshSession();
        console.log('Sessão renovada preventivamente com sucesso!');
      } catch (refreshError) {
        console.error('Erro ao renovar sessão preventivamente:', refreshError);
      }
    }

    return true;
  } catch (error) {
    console.error('Erro inesperado ao verificar sessão:', error);
    return false;
  }
};

// Função auxiliar para redirecionar ao login com feedback
const redirectToLogin = (message?: string) => {
  if (window.location.pathname === '/login') {
    console.log('Já estamos na página de login, evitando redirecionamento em loop.');
    return;
  }
  
  console.log('Redirecionando para login:', { message, timestamp: new Date().toISOString() });
  
  // Limpa apenas dados da sessão, não todo o localStorage
  const authTokenKey = 'muran-auth-token';
  localStorage.removeItem(authTokenKey);
  
  if (message) {
    sessionStorage.setItem('auth_message', message);
  }
  
  const returnUrl = encodeURIComponent(window.location.pathname);
  window.location.href = `/login?returnTo=${returnUrl}`;
};

// Configurar listener para mudanças de autenticação
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Evento de autenticação:', {
    event,
    sessionExists: !!session,
    timestamp: new Date().toISOString()
  });

  if (event === 'SIGNED_OUT') {
    redirectToLogin('Você foi desconectado com sucesso.');
    return;
  }

  if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && !session) {
    console.warn('Sessão inválida detectada após evento:', event);
    
    const { data: currentSession } = await supabase.auth.getSession();
    if (!currentSession.session) {
      redirectToLogin(errorMessages.AUTH_EXPIRED);
    }
    return;
  }
  
  if (event === 'SIGNED_IN') {
    console.log('Usuário conectado, verificando storage');
    const authData = localStorage.getItem('muran-auth-token');
    if (!authData) {
      console.warn('Token não encontrado na storage após login');
      
      const { data: currentSession } = await supabase.auth.getSession();
      if (!currentSession.session) {
        redirectToLogin(errorMessages.AUTH_INVALID);
      }
    }
  }
  
  if (event === 'TOKEN_REFRESHED' && session) {
    console.log('Token atualizado com sucesso:', {
      expiresAt: new Date(session.expires_at! * 1000).toISOString(),
      timestamp: new Date().toISOString()
    });
  }
});

// Verificar sessão periodicamente - reduzindo frequência para 15 minutos
const SESSION_CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutos

setInterval(async () => {
  try {
    if (window.location.pathname === '/login') {
      return;
    }
    
    const isSessionValid = await checkSession();
    
    if (!isSessionValid) {
      console.warn('Sessão inválida detectada na verificação periódica');
      redirectToLogin(errorMessages.AUTH_EXPIRED);
    }
  } catch (error) {
    console.error('Erro na verificação periódica:', error);
  }
}, SESSION_CHECK_INTERVAL);
