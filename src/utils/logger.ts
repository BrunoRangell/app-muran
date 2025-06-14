
export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogModule = 
  | "AUTH" 
  | "CLIENT" 
  | "PAYMENT" 
  | "COST" 
  | "COSTS"
  | "SYSTEM" 
  | "DATA_SERVICE" 
  | "META_ADS" 
  | "GOOGLE_ADS" 
  | "BATCH" 
  | "GOALS"
  | "VALIDATOR"
  | "VALIDATION"
  | "COSTS_PAGE"
  | "TASKS"
  | "CLIENT_INFO"
  | "AUTO_REVIEW"
  | "GOOGLE_ADS_REVIEW"
  | "BATCH_OPERATIONS";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: LogModule;
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private log(level: LogLevel, module: LogModule, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data
    };

    this.logs.push(entry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    const logMethod = level === "error" ? console.error : 
                     level === "warn" ? console.warn : 
                     level === "debug" ? console.debug : console.log;
    
    if (data) {
      logMethod(`[${module}] ${message}`, data);
    } else {
      logMethod(`[${module}] ${message}`);
    }
  }

  debug(module: LogModule, message: string, data?: any) {
    this.log("debug", module, message, data);
  }

  info(module: LogModule, message: string, data?: any) {
    this.log("info", module, message, data);
  }

  warn(module: LogModule, message: string, data?: any) {
    this.log("warn", module, message, data);
  }

  error(module: LogModule, message: string, data?: any) {
    this.log("error", module, message, data);
  }

  getLogs(module?: LogModule, level?: LogLevel): LogEntry[] {
    return this.logs.filter(log => 
      (!module || log.module === module) && 
      (!level || log.level === level)
    );
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();
