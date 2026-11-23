import { NextRequest, NextResponse } from 'next/server';

const cookieName = 'orbit_session';
const lifetime = 7 * 24 * 60 * 60;
const endpoints: Record<string, string[]> = {
  health: ['GET'], me: ['GET'], 'auth/register': ['POST'], 'auth/login': ['POST'], 'auth/logout': ['POST'],
  workspace: ['GET', 'PUT'],
};
const noCache = { 'Cache-Control': 'no-store' };

function error(message: string, status: number) {
  return NextResponse.json({ message }, { status, headers: noCache });
}

async function proxy(request: NextRequest, context: { params: Promise<{ endpoint: string[] }> }) {
  const path = (await context.params).endpoint.join('/');
  if (!Object.hasOwn(endpoints, path) || !endpoints[path]?.includes(request.method)) return error('Rota indisponível.', 404);
  const origin = process.env.ORBIT_WEB_ORIGIN || `${request.nextUrl.protocol}//${request.headers.get('host')}`;
  if (request.method !== 'GET' && request.headers.get('origin') !== origin) {
    return error('Origem da requisição inválida.', 403);
  }

  const publicHealth = path === 'health';
  const startsSession = path === 'auth/login' || path === 'auth/register';
  const token = request.cookies.get(cookieName)?.value;
  if (!publicHealth && !startsSession && !token) {
    if (path === 'auth/logout') return new NextResponse(null, { status: 204, headers: noCache });
    return error('Entre na sua conta.', 401);
  }

  const headers = new Headers();
  if (token && !publicHealth && !startsSession) headers.set('Authorization', `Bearer ${token}`);
  const account = request.headers.get('x-orbit-account');
  if (account && !publicHealth) headers.set('X-Orbit-Account', account);
  const expectsBody = startsSession || request.method === 'PUT';
  const body = expectsBody ? request.body : null;
  if (expectsBody && request.headers.get('content-type')?.split(';')[0] !== 'application/json') {
    return error('Envie os dados em JSON.', 415);
  }
  if (body) headers.set('Content-Type', 'application/json');
  const base = (process.env.ORBIT_API_URL || process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001/api/v1').replace(/\/$/, '');

  let response: Response;
  try {
    response = await fetch(`${base}/${path}`, {
      method: request.method, headers, body,
      ...(body && { duplex: 'half' }),
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(publicHealth ? 2500 : 12_000),
    });
  } catch {
    return error('O servidor está indisponível. Tente novamente.', 503);
  }

  if (startsSession && response.ok) {
    const payload = await response.json();
    if (typeof payload.token !== 'string' || !/^[\w-]{43}$/.test(payload.token)) return error('Sessão indisponível.', 502);
    const result = NextResponse.json(payload.account, { status: response.status, headers: noCache });
    result.cookies.set(cookieName, payload.token, {
      httpOnly: true, sameSite: 'lax', secure: origin.startsWith('https://'), path: '/', maxAge: lifetime,
    });
    return result;
  }

  const result = new NextResponse(response.body, {
    status: response.status,
    headers: { ...noCache, 'Content-Type': 'application/json' },
  });
  if (path === 'auth/logout' && (response.ok || response.status === 401)) result.cookies.delete(cookieName);
  return result;
}

export { proxy as GET, proxy as POST, proxy as PUT };
