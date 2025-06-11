/**
 * Production-ready logging utility
 * Centralizes logging and prevents console logs in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  context?: string;
  data?: any;
  user?: string;
}

const isProduction = import.meta.env.PROD;
const enableDebugLogs = !isProduction || import.meta.env.VITE_ENABLE_DEBUG === 'true';

/**
 * Centralized logger that handles different environments
 */
export const logger = {
  debug: (message: string, options?: LogOptions) => {
    if (!enableDebugLogs) return;
    
    console.debug(
      `[DEBUG]${options?.context ? ` [${options.context}]` : ''}:`,
      message,
      options?.data || ''
    );
  },
  
  info: (message: string, options?: LogOptions) => {
    if (isProduction) return;
    
    console.info(
      `[INFO]${options?.context ? ` [${options.context}]` : ''}:`,
      message,
      options?.data || ''
    );
  },
  
  warn: (message: string, options?: LogOptions) => {
    console.warn(
      `[WARN]${options?.context ? ` [${options.context}]` : ''}:`,
      message,
      options?.data || ''
    );
    
    // In a real app, you might send warnings to a monitoring service
    if (isProduction) {
      // sendToMonitoringService('warning', message, options);
    }
  },
  
  error: (error: Error | string, options?: LogOptions) => {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error(
      `[ERROR]${options?.context ? ` [${options.context}]` : ''}:`,
      errorMessage,
      errorStack,
      options?.data || ''
    );
    
    // In a real app, you would send errors to a monitoring service
    if (isProduction) {
      // sendToMonitoringService('error', errorMessage, { ...options, stack: errorStack });
    }
  }
};

// Example of how you might send logs to a monitoring service
// function sendToMonitoringService(level: LogLevel, message: string, data?: any) {
//   // Implementation would depend on your monitoring service (Sentry, LogRocket, etc.)
// }