
type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  context?: any;
}

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development';

  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date().toISOString();
    const contextStr = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : '';
    return `[${timestamp}] [${entry.level}] [${entry.module}] ${entry.message}${contextStr}`;
  }

  info(module: string, message: string, context?: any) {
    if (this.isDevelopment) {
      console.log(this.formatMessage({ level: 'INFO', module, message, context }));
    }
  }

  warn(module: string, message: string, context?: any) {
    console.warn(this.formatMessage({ level: 'WARN', module, message, context }));
  }

  error(module: string, message: string, context?: any) {
    console.error(this.formatMessage({ level: 'ERROR', module, message, context }));
  }
}

export const logger = new Logger();
