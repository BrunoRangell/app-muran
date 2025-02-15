
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

// Função para verificar o estado da sessão com mais detalhes
export const checkSession = async () => {
  try {
    console.log('Verificando sessão...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar sessão:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw new AppError(errorMessages.AUTH_EXPIRED, 'AUTH_EXPIRED');
    }

    if (!session) {
      console.warn('Sessão não encontrada');
      return false;
    }

    // Verifica se o token está próximo de expirar (30 minutos)
    const expiresAt = new Date(session.expires_at! * 1000);
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (expiresAt.getTime() - Date.now() < thirtyMinutes) {
      console.warn('Sessão próxima de expirar, tentando renovar...');
      await supabase.auth.refreshSession();
    }

    return true;
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    return false;
  }
};

// Função auxiliar para redirecionar ao login com feedback
const redirectToLogin = (message?: string) => {
  console.log('Redirecionando para login:', { message, timestamp: new Date().toISOString() });
  localStorage.clear();
  
  // Salva a mensagem para ser exibida após o redirecionamento
  if (message) {
    sessionStorage.setItem('auth_message', message);
  }
  
  window.location.href = '/login';
};

// Configurar listener para mudanças de autenticação com mais logs
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Evento de autenticação:', {
    event,
    sessionExists: !!session,
    timestamp: new Date().toISOString()
  });

  // Se o usuário foi desconectado
  if (event === 'SIGNED_OUT') {
    redirectToLogin('Você foi desconectado com sucesso.');
    return;
  }

  // Se a sessão expirou ou foi atualizada sem sessão válida
  if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && !session) {
    console.warn('Sessão inválida detectada após evento:', event);
    redirectToLogin(errorMessages.AUTH_EXPIRED);
    return;
  }
  
  // Se o usuário se conectou
  if (event === 'SIGNED_IN') {
    console.log('Usuário conectado, verificando storage');
    const authData = localStorage.getItem('muran-auth-token');
    if (!authData) {
      console.warn('Token não encontrado na storage após login');
      redirectToLogin(errorMessages.AUTH_INVALID);
    }
  }
});

// Verificar sessão periodicamente com intervalo variável
let checkInterval = 60000; // Começa com 1 minuto
let consecutiveFailures = 0;

setInterval(async () => {
  try {
    const isSessionValid = await checkSession();
    
    if (!isSessionValid && window.location.pathname !== '/login') {
      console.warn('Sessão inválida detectada na verificação periódica');
      redirectToLogin(errorMessages.AUTH_EXPIRED);
      return;
    }

    // Se chegou aqui, resetamos as falhas e podemos aumentar o intervalo
    consecutiveFailures = 0;
    checkInterval = Math.min(checkInterval * 2, 300000); // Máximo de 5 minutos
  } catch (error) {
    console.error('Erro na verificação periódica:', error);
    consecutiveFailures++;
    
    // Reduz o intervalo se houver falhas consecutivas
    if (consecutiveFailures > 2) {
      checkInterval = Math.max(checkInterval / 2, 30000); // Mínimo de 30 segundos
    }
  }
}, checkInterval);

// Interceptor para requisições do Supabase
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token atualizado com sucesso');
  }
});
