export interface ApiEnvironment {
  NODE_ENV: 'development' | 'test' | 'production';
  API_PORT: number;
  FRONTEND_URL: string;
  DATABASE_URL: string;
}

export function validateEnvironment(values: Record<string, unknown>): ApiEnvironment {
  const environment = values.NODE_ENV ?? 'development';
  if (environment !== 'development' && environment !== 'test' && environment !== 'production') {
    throw new Error('Configuração inválida: NODE_ENV deve ser development, test ou production.');
  }

  const rawPort = values.API_PORT ?? '3001';
  const port = Number(rawPort);
  if (!/^\d+$/.test(String(rawPort)) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Configuração inválida: API_PORT deve ser um inteiro entre 1 e 65535.');
  }

  const origin = values.FRONTEND_URL ?? 'http://localhost:3000';
  if (typeof origin !== 'string') {
    throw new Error('Configuração inválida: FRONTEND_URL deve ser uma origem HTTP ou HTTPS.');
  }
  try {
    const url = new URL(origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash || url.origin !== origin) {
      throw new Error('invalid origin');
    }
  } catch {
    throw new Error('Configuração inválida: FRONTEND_URL deve ser uma origem HTTP ou HTTPS sem caminho, credenciais ou wildcard.');
  }

  const databaseUrl = values.DATABASE_URL;
  if (databaseUrl !== undefined && typeof databaseUrl !== 'string') {
    throw new Error('Configuração inválida: DATABASE_URL deve ser uma string.');
  }
  if (databaseUrl !== undefined && databaseUrl !== '' && !databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    throw new Error('Configuração inválida: DATABASE_URL deve ser uma URL PostgreSQL válida.');
  }

  return { NODE_ENV: environment, API_PORT: port, FRONTEND_URL: origin, DATABASE_URL: databaseUrl ?? '' };
}
