
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
          return localStorage.getItem(key);
        } catch (error) {
          console.error('Erro ao recuperar dado da storage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Erro ao salvar dado na storage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Erro ao remover dado da storage:', error);
        }
      },
    },
  },
});

// Variável para controlar o delay entre tentativas de renovação de token
let tokenRefreshDelay = false;

// Função para verificar o estado da sessão com mais detalhes
export const checkSession = async () => {
  try {
    if (tokenRefreshDelay) {
      return true;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[AUTH] Erro ao verificar sessão:', error);
      
      try {
        tokenRefreshDelay = true;
        const { data } = await supabase.auth.refreshSession();
        tokenRefreshDelay = false;
        
        if (data.session) {
          return true;
        }
      } catch (refreshError) {
        console.error('[AUTH] Erro ao renovar sessão:', refreshError);
        tokenRefreshDelay = false;
        throw new AppError(errorMessages.AUTH_EXPIRED, 'AUTH_EXPIRED');
      }
      
      throw new AppError(errorMessages.AUTH_EXPIRED, 'AUTH_EXPIRED');
    }

    if (!session) {
      try {
        tokenRefreshDelay = true;
        const { data } = await supabase.auth.refreshSession();
        tokenRefreshDelay = false;
        
        if (data.session) {
          return true;
        }
      } catch (refreshError) {
        console.error('[AUTH] Erro ao tentar renovar sessão inexistente:', refreshError);
        tokenRefreshDelay = false;
      }
      
      return false;
    }

    // Verificar se o token está próximo de expirar (60 minutos)
    const expiresAt = new Date(session.expires_at! * 1000);
    const sixtyMinutes = 60 * 60 * 1000;
    
    if (expiresAt.getTime() - Date.now() < sixtyMinutes) {
      tokenRefreshDelay = true;
      
      try {
        await supabase.auth.refreshSession();
      } catch (refreshError) {
        console.error('[AUTH] Erro ao renovar sessão preventivamente:', refreshError);
      } finally {
        tokenRefreshDelay = false;
      }
    }

    return true;
  } catch (error) {
    console.error('[AUTH] Erro inesperado ao verificar sessão:', error);
    tokenRefreshDelay = false;
    return false;
  }
};

// Função auxiliar para redirecionar ao login com feedback
const redirectToLogin = (message?: string) => {
  if (window.location.pathname === '/login') {
    return;
  }
  
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
  if (event === 'SIGNED_OUT') {
    redirectToLogin('Você foi desconectado com sucesso.');
    return;
  }

  if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && !session) {
    const { data: currentSession } = await supabase.auth.getSession();
    if (!currentSession.session) {
      try {
        tokenRefreshDelay = true;
        const { data } = await supabase.auth.refreshSession();
        tokenRefreshDelay = false;
        
        if (data.session) {
          return;
        }
      } catch (refreshError) {
        console.error('[AUTH] Erro ao renovar sessão após evento sem sessão:', refreshError);
        tokenRefreshDelay = false;
      }
      
      redirectToLogin(errorMessages.AUTH_EXPIRED);
    }
    return;
  }
  
  if (event === 'SIGNED_IN') {
    const authData = localStorage.getItem('muran-auth-token');
    if (!authData) {
      const { data: currentSession } = await supabase.auth.getSession();
      if (!currentSession.session) {
        redirectToLogin(errorMessages.AUTH_INVALID);
      }
    }
  }
});

// Verificar sessão periodicamente
const SESSION_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutos

setInterval(async () => {
  try {
    if (window.location.pathname === '/login') {
      return;
    }
    
    const isSessionValid = await checkSession();
    
    if (!isSessionValid) {
      try {
        tokenRefreshDelay = true;
        const { data } = await supabase.auth.refreshSession();
        tokenRefreshDelay = false;
        
        if (!data.session) {
          redirectToLogin(errorMessages.AUTH_EXPIRED);
        }
      } catch (error) {
        console.error('[AUTH] Erro na tentativa final de renovação:', error);
        tokenRefreshDelay = false;
        redirectToLogin(errorMessages.AUTH_EXPIRED);
      }
    }
  } catch (error) {
    console.error('[AUTH] Erro na verificação periódica:', error);
  }
}, SESSION_CHECK_INTERVAL);
