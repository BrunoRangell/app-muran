// Utility de logging que respeita o ambiente
const isDevelopment = import.meta.env.DEV;

export const logger = {
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  info: (...args: any[]) => {
    console.info(...args);
  },
  warn: (...args: any[]) => {
    console.warn(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
};
