// utils/logger.ts
// src/utils/logger.ts

// Determine the environment based on NODE_ENV
const isDevelopment = process.env.NODE_ENV === 'development';

// Logger object with methods for different log levels
export const logger = {
  // Log informational messages, only in development
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },
  // Log errors in all environments (development and production)
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },
  // Log warnings, only in development
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },
};
