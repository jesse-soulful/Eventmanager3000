/**
 * Environment variable validation and configuration
 * Fails fast if required variables are missing
 */

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
  FRONTEND_URL?: string;
  CORS_ORIGINS?: string[];
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getEnvVarOptional(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}

function getEnvVarArray(name: string, defaultValue?: string[]): string[] {
  const value = process.env[name];
  if (value) {
    return value.split(',').map(v => v.trim()).filter(v => v.length > 0);
  }
  return defaultValue || [];
}

export function validateEnv(): EnvConfig {
  const nodeEnv = getEnvVarOptional('NODE_ENV', 'development');
  const port = parseInt(getEnvVarOptional('PORT', '3001') || '3001', 10);
  
  // Validate required variables
  const databaseUrl = getEnvVar('DATABASE_URL');
  const betterAuthSecret = getEnvVar('BETTER_AUTH_SECRET');
  
  // Check for default secret in production
  if (nodeEnv === 'production' && betterAuthSecret === 'change-this-secret-key-in-production') {
    throw new Error(
      'BETTER_AUTH_SECRET must be changed from default value in production. ' +
      'Please set a strong secret key.'
    );
  }

  // Optional variables with defaults
  const betterAuthUrl = getEnvVarOptional('BETTER_AUTH_URL', `http://localhost:${port}`);
  const frontendUrl = getEnvVarOptional('FRONTEND_URL', 'http://localhost:5173');
  
  // CORS origins - can be comma-separated list or use default
  const corsOrigins = getEnvVarArray('CORS_ORIGINS', [
    'http://localhost:5173',
    'http://localhost:3000',
    frontendUrl,
  ]);

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: databaseUrl,
    BETTER_AUTH_SECRET: betterAuthSecret,
    BETTER_AUTH_URL: betterAuthUrl,
    FRONTEND_URL: frontendUrl,
    CORS_ORIGINS: corsOrigins,
  };
}

// Validate on import
export const env = validateEnv();

