
type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  context?: any;
}

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development';
  private enabledModules = new Set(['AUTH', 'API', 'ERROR', 'PAYMENT', 'CLIENT']);

  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const contextStr = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
    return `[${timestamp}] [${entry.module}] ${entry.message}${contextStr}`;
  }

  private shouldLog(module: string): boolean {
    return this.isDevelopment && this.enabledModules.has(module);
  }

  info(module: string, message: string, context?: any) {
    if (this.shouldLog(module)) {
      console.log(this.formatMessage({ level: 'INFO', module, message, context }));
    }
  }

  warn(module: string, message: string, context?: any) {
    if (this.shouldLog(module)) {
      console.warn(this.formatMessage({ level: 'WARN', module, message, context }));
    }
  }

  error(module: string, message: string, context?: any) {
    console.error(this.formatMessage({ level: 'ERROR', module, message, context }));
  }

  debug(module: string, message: string, context?: any) {
    if (this.isDevelopment && this.shouldLog(module)) {
      console.debug(this.formatMessage({ level: 'DEBUG', module, message, context }));
    }
  }
}

export const logger = new Logger();
