
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

// Variável para controlar o delay entre tentativas de renovação de token
let tokenRefreshDelay = false;

// Função para verificar o estado da sessão com mais detalhes
export const checkSession = async () => {
  try {
    // Verifica se já existe uma tentativa de renovação em andamento
    if (tokenRefreshDelay) {
      console.log('Já existe uma renovação de token em andamento, ignorando verificação.');
      return true;
    }

    console.log('Verificando sessão...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar sessão:', {
        error,
        timestamp: new Date().toISOString()
      });
      
      // Tenta renovar a sessão antes de falhar
      try {
        tokenRefreshDelay = true;
        console.log('Tentando renovar sessão após erro...');
        const { data } = await supabase.auth.refreshSession();
        tokenRefreshDelay = false;
        
        if (data.session) {
          console.log('Sessão renovada com sucesso após erro.');
          return true;
        }
      } catch (refreshError) {
        console.error('Erro ao renovar sessão após erro inicial:', refreshError);
        tokenRefreshDelay = false;
        throw new AppError(errorMessages.AUTH_EXPIRED, 'AUTH_EXPIRED');
      }
      
      throw new AppError(errorMessages.AUTH_EXPIRED, 'AUTH_EXPIRED');
    }

    if (!session) {
      console.warn('Sessão não encontrada');
      
      // Tenta renovar a sessão antes de falhar
      try {
        tokenRefreshDelay = true;
        console.log('Tentando renovar sessão inexistente...');
        const { data } = await supabase.auth.refreshSession();
        tokenRefreshDelay = false;
        
        if (data.session) {
          console.log('Sessão criada com sucesso após não encontrar sessão.');
          return true;
        }
      } catch (refreshError) {
        console.error('Erro ao tentar renovar sessão inexistente:', refreshError);
        tokenRefreshDelay = false;
      }
      
      return false;
    }

    // Verifica se o token está próximo de expirar (60 minutos)
    const expiresAt = new Date(session.expires_at! * 1000);
    const sixtyMinutes = 60 * 60 * 1000;
    
    if (expiresAt.getTime() - Date.now() < sixtyMinutes) {
      console.log('Sessão próxima de expirar, renovando de forma preventiva...');
      tokenRefreshDelay = true;
      
      try {
        await supabase.auth.refreshSession();
        console.log('Sessão renovada preventivamente com sucesso!');
      } catch (refreshError) {
        console.error('Erro ao renovar sessão preventivamente:', refreshError);
      } finally {
        tokenRefreshDelay = false;
      }
    }

    return true;
  } catch (error) {
    console.error('Erro inesperado ao verificar sessão:', error);
    tokenRefreshDelay = false;
    return false;
  }
};

// Função auxiliar para redirecionar ao login com feedback
const redirectToLogin = (message?: string) => {
  // Verifica se já estamos na página de login para evitar redirecionamento em loop
  if (window.location.pathname === '/login') {
    console.log('Já estamos na página de login, evitando redirecionamento em loop.');
    return;
  }
  
  console.log('Redirecionando para login:', { message, timestamp: new Date().toISOString() });
  
  // Limpa apenas dados da sessão, não todo o localStorage
  const authTokenKey = 'muran-auth-token';
  localStorage.removeItem(authTokenKey);
  
  // Salva a mensagem para ser exibida após o redirecionamento
  if (message) {
    sessionStorage.setItem('auth_message', message);
  }
  
  // Redireciona para login com a URL atual para retornar após o login
  const returnUrl = encodeURIComponent(window.location.pathname);
  window.location.href = `/login?returnTo=${returnUrl}`;
};

// Configurar listener para mudanças de autenticação com mais logs e lógica robusta
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Evento de autenticação:', {
    event,
    sessionExists: !!session,
    timestamp: new Date().toISOString()
  });

  // Se o usuário foi desconectado explicitamente
  if (event === 'SIGNED_OUT') {
    redirectToLogin('Você foi desconectado com sucesso.');
    return;
  }

  // Se a sessão expirou ou foi atualizada sem sessão válida
  if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && !session) {
    console.warn('Sessão inválida detectada após evento:', event);
    
    // Verifica antes se realmente não há sessão válida para evitar falsos positivos
    const { data: currentSession } = await supabase.auth.getSession();
    if (!currentSession.session) {
      // Tenta renovar a sessão antes de redirecionar
      try {
        tokenRefreshDelay = true;
        console.log('Tentando renovar sessão após evento sem sessão...');
        const { data } = await supabase.auth.refreshSession();
        tokenRefreshDelay = false;
        
        if (data.session) {
          console.log('Sessão renovada com sucesso após evento sem sessão.');
          return;
        }
      } catch (refreshError) {
        console.error('Erro ao renovar sessão após evento sem sessão:', refreshError);
        tokenRefreshDelay = false;
      }
      
      redirectToLogin(errorMessages.AUTH_EXPIRED);
    }
    return;
  }
  
  // Se o usuário se conectou
  if (event === 'SIGNED_IN') {
    console.log('Usuário conectado, verificando storage');
    const authData = localStorage.getItem('muran-auth-token');
    if (!authData) {
      console.warn('Token não encontrado na storage após login');
      
      // Verifica se realmente não há sessão válida
      const { data: currentSession } = await supabase.auth.getSession();
      if (!currentSession.session) {
        redirectToLogin(errorMessages.AUTH_INVALID);
      }
    }
  }
  
  // Se o token foi atualizado com sucesso, registra isso
  if (event === 'TOKEN_REFRESHED' && session) {
    console.log('Token atualizado com sucesso:', {
      expiresAt: new Date(session.expires_at! * 1000).toISOString(),
      timestamp: new Date().toISOString()
    });
  }
});

// Verificar sessão periodicamente com intervalo fixo mais longo
const SESSION_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutos

setInterval(async () => {
  try {
    if (window.location.pathname === '/login') {
      // Não verifica sessão na página de login
      return;
    }
    
    const isSessionValid = await checkSession();
    
    if (!isSessionValid) {
      console.warn('Sessão inválida detectada na verificação periódica');
      
      // Última tentativa de renovação antes de redirecionar
      try {
        tokenRefreshDelay = true;
        console.log('Tentativa final de renovação de sessão...');
        const { data } = await supabase.auth.refreshSession();
        tokenRefreshDelay = false;
        
        if (!data.session) {
          redirectToLogin(errorMessages.AUTH_EXPIRED);
        }
      } catch (error) {
        console.error('Erro na tentativa final de renovação:', error);
        tokenRefreshDelay = false;
        redirectToLogin(errorMessages.AUTH_EXPIRED);
      }
    }
  } catch (error) {
    console.error('Erro na verificação periódica:', error);
  }
}, SESSION_CHECK_INTERVAL);

// Interceptor para requisições do Supabase
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token atualizado com sucesso');
  }
});
