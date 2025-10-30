function getEnvVar(name, options = {}) {
  const value = process.env[name] ?? options.defaultValue
  if ((options.required ?? true) && (value === undefined || value === '')) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 0) || 3001,
  SUPABASE_URL: getEnvVar('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  OPENAI_API_KEY: getEnvVar('OPENAI_API_KEY'),
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  KEY_ENCRYPTION_SECRET: getEnvVar('KEY_ENCRYPTION_SECRET'),
  HUBSPOT_FALLBACK_KEY: process.env.HUBSPOT_PRIVATE_APP_KEY ?? '',
}
