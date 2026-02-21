import logger from './logger';

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'PYTHON_API_URL',
  'PYTHON_AI_SERVER_API_KEY',
] as const;

/**
 * Optional but recommended environment variables
 */
const RECOMMENDED_ENV_VARS = [
  'REDIS_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'FRONTEND_URL',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
] as const;

/**
 * Minimum lengths for sensitive secrets
 */
const SECRET_MIN_LENGTHS = {
  JWT_ACCESS_SECRET: 32,
  JWT_REFRESH_SECRET: 32,
  STRIPE_SECRET_KEY: 20,
  STRIPE_WEBHOOK_SECRET: 20,
  PYTHON_AI_SERVER_API_KEY: 20,
} as const;

/**
 * Validate all required environment variables at startup
 * Fails fast if critical configuration is missing
 */
export function validateEnvironmentVariables(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  logger.info('Validating environment variables...');

  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar];
    
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${envVar}`);
    } else {
      // Check secret strength
      if (envVar in SECRET_MIN_LENGTHS) {
        const minLength = SECRET_MIN_LENGTHS[envVar as keyof typeof SECRET_MIN_LENGTHS];
        if (value.length < minLength) {
          errors.push(
            `${envVar} is too short (${value.length} chars). Minimum required: ${minLength} chars for security.`
          );
        }
      }
    }
  }

  // Check recommended variables
  for (const envVar of RECOMMENDED_ENV_VARS) {
    const value = process.env[envVar];
    
    if (!value || value.trim() === '') {
      warnings.push(`Missing recommended environment variable: ${envVar}`);
    }
  }

  // Validate MongoDB URI format
  if (process.env.MONGODB_URI) {
    if (!process.env.MONGODB_URI.startsWith('mongodb://') && 
        !process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
      errors.push('MONGODB_URI must start with mongodb:// or mongodb+srv://');
    }
  }

  // Validate JWT expiry times
  if (process.env.JWT_ACCESS_EXPIRES_IN) {
    if (!isValidTimeString(process.env.JWT_ACCESS_EXPIRES_IN)) {
      warnings.push('JWT_ACCESS_EXPIRES_IN has invalid format. Use format like "15m", "1h", "7d"');
    }
  }

  if (process.env.JWT_REFRESH_EXPIRES_IN) {
    if (!isValidTimeString(process.env.JWT_REFRESH_EXPIRES_IN)) {
      warnings.push('JWT_REFRESH_EXPIRES_IN has invalid format. Use format like "15m", "1h", "7d"');
    }
  }

  // Validate PORT
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push('PORT must be a valid number between 1 and 65535');
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    logger.warn('Environment variable warnings:');
    warnings.forEach(warning => logger.warn(`  - ${warning}`));
  }

  // Fail fast on errors
  if (errors.length > 0) {
    logger.error('❌ Environment variable validation failed:');
    errors.forEach(error => logger.error(`  - ${error}`));
    logger.error('');
    logger.error('Please check your .env file and ensure all required variables are set.');
    logger.error('See .env.example for reference.');
    throw new Error('Environment variable validation failed. Cannot start server.');
  }

  logger.info('✅ Environment variable validation passed');
}

/**
 * Validate time string format (e.g., "15m", "1h", "7d")
 */
function isValidTimeString(timeStr: string): boolean {
  return /^\d+[smhd]$/.test(timeStr);
}

/**
 * Get environment variable with fallback
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is not set and no default provided`);
  }
  return value || defaultValue!;
}

/**
 * Get environment variable as number
 */
export function getEnvVarAsNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (!value) {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is not set and no default provided`);
    }
    return defaultValue;
  }
  
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  
  return num;
}

/**
 * Get environment variable as boolean
 */
export function getEnvVarAsBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}
