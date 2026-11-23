export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export async function orbitApi<T>(path: string, options?: { method?: string; body?: unknown; accountId?: string }): Promise<T> {
  const response = await fetch(`/api/orbit/${path}`, {
    method: options?.method ?? 'GET',
    headers: {
      ...(options?.body !== undefined && { 'Content-Type': 'application/json' }),
      ...(options?.accountId && { 'X-Orbit-Account': options.accountId }),
    },
    body: options?.body === undefined ? undefined : JSON.stringify(options.body),
    cache: 'no-store',
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json();
  if (!response.ok) throw new ApiError(response.status, response.status >= 500
    ? 'O servidor está indisponível. Tente novamente.' : body.message);
  return body as T;
}
