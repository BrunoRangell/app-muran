
type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type LogModule = 'AUTH' | 'API' | 'ERROR' | 'VALIDATION' | 'PAYMENT' | 'CLIENT' | 'BATCH' | 'GOOGLE_ADS' | 'META_ADS' | 'SYSTEM';

interface LogEntry {
  level: LogLevel;
  module: LogModule;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDev = import.meta.env.DEV;
  
  private formatMessage(module: LogModule, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    let formattedMessage = `[${module}] ${message}`;
    
    if (data) {
      formattedMessage += ` - ${JSON.stringify(data)}`;
    }
    
    return formattedMessage;
  }

  info(module: LogModule, message: string, data?: any): void {
    if (!this.isDev) return;
    console.info(this.formatMessage(module, message, data));
  }

  warn(module: LogModule, message: string, data?: any): void {
    console.warn(this.formatMessage(module, message, data));
  }

  error(module: LogModule, message: string, error?: any): void {
    const errorData = error instanceof Error ? { 
      message: error.message, 
      stack: error.stack 
    } : error;
    
    console.error(this.formatMessage(module, message, errorData));
  }

  debug(module: LogModule, message: string, data?: any): void {
    if (!this.isDev) return;
    console.debug(this.formatMessage(module, message, data));
  }
}

export const logger = new Logger();
