
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
  enabled: process.env.NODE_ENV !== 'production',
  minLevel: 'info'
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

/**
 * Cria uma instância de logger para um contexto específico
 */
export function createLogger(context?: string) {
  return {
    debug: (message: any, ...args: any[]) => {
      if (shouldLog('debug', context)) {
        console.debug(formatLogMessage(context, message), ...args);
      }
    },
    
    info: (message: any, ...args: any[]) => {
      if (shouldLog('info', context)) {
        console.info(formatLogMessage(context, message), ...args);
      }
    },
    
    warn: (message: any, ...args: any[]) => {
      if (shouldLog('warn', context)) {
        console.warn(formatLogMessage(context, message), ...args);
      }
    },
    
    error: (message: any, ...args: any[]) => {
      if (shouldLog('error', context)) {
        console.error(formatLogMessage(context, message), ...args);
      }
    },
    
    // Método para logs específicos de API
    api: (message: any, ...args: any[]) => {
      if (shouldLog('debug', context)) {
        console.debug(formatLogMessage(`${context}-api`, message), ...args);
      }
    }
  };
}

/**
 * Configura as opções de logging globais
 */
export function configureLogging(options: Partial<LoggerOptions>): void {
  Object.assign(globalConfig, options);
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
      minLevel: 'debug'
    });
  }
}

// Exportar uma instância padrão do logger sem contexto
export const logger = createLogger('app');

// Configuração inicial com base no ambiente
setupEnvironmentLogging();
