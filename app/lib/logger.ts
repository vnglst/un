/**
 * Logger utility for the UN Speeches application
 * Provides structured logging with different levels and context
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment: boolean
  private minLogLevel: LogLevel

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.minLogLevel = this.isDevelopment ? 'debug' : 'info'
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    }
    return levels[level] >= levels[this.minLogLevel]
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`

    if (context && Object.keys(context).length > 0) {
      return `${prefix} ${message} | ${JSON.stringify(context)}`
    }

    return `${prefix} ${message}`
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext: LogContext = {
        ...context,
      }

      if (error instanceof Error) {
        errorContext.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      } else if (error !== undefined) {
        errorContext.error = String(error)
      }

      console.error(this.formatMessage('error', message, errorContext))
    }
  }

  // Database-specific logging methods
  dbQuery(query: string, params?: unknown[], executionTime?: number): void {
    this.debug('Database query executed', {
      query: query.trim(),
      params,
      executionTime: executionTime ? `${executionTime}ms` : undefined,
    })
  }

  dbError(query: string, error: Error, params?: unknown[]): void {
    this.error('Database query failed', error, {
      query: query.trim(),
      params,
    })
  }

  // Request-specific logging methods
  requestStart(method: string, url: string, context?: LogContext): void {
    this.info('Request started', {
      method,
      url,
      ...context,
    })
  }

  requestEnd(
    method: string,
    url: string,
    statusCode: number,
    duration: number
  ): void {
    this.info('Request completed', {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
    })
  }

  // Search-specific logging methods
  searchQuery(
    filters: LogContext,
    resultCount: number,
    executionTime?: number
  ): void {
    this.info('Search executed', {
      filters,
      resultCount,
      executionTime: executionTime ? `${executionTime}ms` : undefined,
    })
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 1000 ? 'warn' : 'debug'
    this[level](`Performance: ${operation}`, {
      duration: `${duration}ms`,
      ...context,
    })
  }
}

// Export singleton instance
export const logger = new Logger()

// Export performance timing utility
export function timeOperation<T>(operation: string, fn: () => T): T {
  const start = Date.now()
  try {
    const result = fn()
    const duration = Date.now() - start
    logger.performance(operation, duration)
    return result
  } catch (error) {
    const duration = Date.now() - start
    logger.error(`Operation failed: ${operation}`, error, {
      duration: `${duration}ms`,
    })
    throw error
  }
}

// Export async performance timing utility
export async function timeAsyncOperation<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - start
    logger.performance(operation, duration)
    return result
  } catch (error) {
    const duration = Date.now() - start
    logger.error(`Async operation failed: ${operation}`, error, {
      duration: `${duration}ms`,
    })
    throw error
  }
}
