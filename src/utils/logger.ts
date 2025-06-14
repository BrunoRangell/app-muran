export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogModule = 
  | 'APP' 
  | 'AUTH' 
  | 'CLIENT' 
  | 'CLIENT_INFO'
  | 'CLIENT_REVIEW'
  | 'AUTO_REVIEW'
  | 'GOOGLE_ADS_REVIEW'
  | 'VALIDATION' 
  | 'PERFORMANCE' 
  | 'SUPABASE' 
  | 'EDGE_FUNCTION' 
  | 'BATCH_OPERATIONS'
  | 'META_REVIEW'
  | 'CRON'
  | 'API'
  | 'SYSTEM'
  | 'DATA_SERVICE'
  | 'META_ADS'
  | 'GOOGLE_ADS'
  | 'BATCH'
  | 'GOALS'
  | 'COSTS'
  | 'FINANCIAL'
  | 'PAYMENTS'
  | 'TEAM'
  | 'SETTINGS'
  | 'IMPORT'
  | 'EXPORT'
  | 'DASHBOARD'
  | 'METRICS'
  | 'UNIFIED_REVIEWS'
  | 'DATABASE';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: LogModule;
  message: string;
  data?: any;
}

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development';

  private formatMessage(level: LogLevel, module: LogModule, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level.toUpperCase()}] [${module}] ${message}`;
    
    if (data && Object.keys(data).length > 0) {
      return `${baseMessage}\nData: ${JSON.stringify(data, null, 2)}`;
    }
    
    return baseMessage;
  }

  debug(module: LogModule, message: string, data?: any) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', module, message, data));
    }
  }

  info(module: LogModule, message: string, data?: any) {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', module, message, data));
    }
  }

  warn(module: LogModule, message: string, data?: any) {
    console.warn(this.formatMessage('warn', module, message, data));
  }

  error(module: LogModule, message: string, error?: any) {
    console.error(this.formatMessage('error', module, message, error));
  }

  // Método para logs em produção (apenas errors e warns críticos)
  production(level: 'error' | 'warn', module: LogModule, message: string, data?: any) {
    if (level === 'error') {
      console.error(this.formatMessage('error', module, message, data));
    } else {
      console.warn(this.formatMessage('warn', module, message, data));
    }
  }
}

export const logger = new Logger();
