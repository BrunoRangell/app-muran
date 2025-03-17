
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  enabled: boolean;
  minLevel: LogLevel;
  context?: string;
}

// Mapeamento para determinar a ordem das severidades dos logs
const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Configuração global de logging
const globalConfig: LoggerOptions = {
  enabled: true,
  minLevel: process.env.NODE_ENV === 'production' ? 'error' : 'info'
};

// Configurações por módulo (namespace)
const moduleConfigs: Record<string, Partial<LoggerOptions>> = {};

/**
 * Verifica se um log deve ser exibido com base na configuração
 */
function shouldLog(level: LogLevel, context?: string): boolean {
  if (!globalConfig.enabled) return false;
  
  // Se existir configuração específica para o contexto
  if (context && moduleConfigs[context]) {
    const moduleConfig = moduleConfigs[context];
    
    // Se o módulo estiver explicitamente desabilitado
    if (moduleConfig.enabled === false) return false;
    
    // Verificar o nível mínimo do módulo, se definido
    if (moduleConfig.minLevel) {
      return LOG_LEVEL_SEVERITY[level] >= LOG_LEVEL_SEVERITY[moduleConfig.minLevel];
    }
  }
  
  // Usar configuração global
  return LOG_LEVEL_SEVERITY[level] >= LOG_LEVEL_SEVERITY[globalConfig.minLevel];
}

/**
 * Formata a mensagem de log com contexto e timestamp
 */
function formatLogMessage(context: string | undefined, message: any): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}] ` : '';
  
  // Se a mensagem for um objeto, formatar como JSON bonito
  const formattedMessage = typeof message === 'object' ? 
    JSON.stringify(message, null, 2) : 
    String(message);
  
  return `${timestamp} ${contextStr}${formattedMessage}`;
}

// Cores para diferentes níveis de log (para console)
const LOG_COLORS = {
  debug: '#6b7280', // Cinza
  info: '#3b82f6',  // Azul
  warn: '#f59e0b',  // Âmbar
  error: '#ef4444'  // Vermelho
};

/**
 * Cria uma instância de logger para um contexto específico
 */
export function createLogger(context?: string) {
  return {
    debug: (message: any, ...args: any[]) => {
      if (shouldLog('debug', context)) {
        console.debug(
          `%c${formatLogMessage(context, message)}`, 
          `color: ${LOG_COLORS.debug}`,
          ...args
        );
      }
    },
    
    info: (message: any, ...args: any[]) => {
      if (shouldLog('info', context)) {
        console.info(
          `%c${formatLogMessage(context, message)}`, 
          `color: ${LOG_COLORS.info}`, 
          ...args
        );
      }
    },
    
    warn: (message: any, ...args: any[]) => {
      if (shouldLog('warn', context)) {
        console.warn(
          `%c${formatLogMessage(context, message)}`, 
          `color: ${LOG_COLORS.warn}`, 
          ...args
        );
      }
    },
    
    error: (message: any, ...args: any[]) => {
      if (shouldLog('error', context)) {
        console.error(
          `%c${formatLogMessage(context, message)}`, 
          `color: ${LOG_COLORS.error}`, 
          ...args
        );
      }
    },
    
    // Método para logs específicos de API
    api: (message: any, ...args: any[]) => {
      if (shouldLog('debug', context)) {
        console.debug(
          `%c${formatLogMessage(`${context}-api`, message)}`, 
          `color: ${LOG_COLORS.debug}`, 
          ...args
        );
      }
    }
  };
}

/**
 * Configura as opções de logging globais
 */
export function configureLogging(options: Partial<LoggerOptions>): void {
  Object.assign(globalConfig, options);
  // Log da alteração de configuração (sempre visível)
  console.info(`%cConfiguração de logs alterada: ${JSON.stringify(options)}`, `color: ${LOG_COLORS.info}`);
}

/**
 * Configura as opções de logging para um módulo específico
 */
export function configureModuleLogging(
  moduleName: string, 
  options: Partial<LoggerOptions>
): void {
  moduleConfigs[moduleName] = {
    ...(moduleConfigs[moduleName] || {}),
    ...options
  };
  // Log da alteração de configuração (sempre visível)
  console.info(`%cConfiguração de logs para '${moduleName}' alterada: ${JSON.stringify(options)}`, `color: ${LOG_COLORS.info}`);
}

/**
 * Desabilita todos os logs não críticos (mantém apenas erros)
 */
export function disableVerboseLogs(): void {
  configureLogging({ minLevel: 'error' });
}

/**
 * Define os níveis de log por ambiente
 */
export function setupEnvironmentLogging(): void {
  // Em produção, só mostrar erros
  if (process.env.NODE_ENV === 'production') {
    configureLogging({
      enabled: true,
      minLevel: 'error'
    });
  } 
  // Em desenvolvimento, mostrar todos os logs
  else {
    configureLogging({
      enabled: true,
      minLevel: 'info'
    });
  }
}

// Exportar uma instância padrão do logger sem contexto
export const logger = createLogger('app');

// Configuração inicial com base no ambiente
setupEnvironmentLogging();
