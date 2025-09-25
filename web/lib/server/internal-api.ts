import {cookies, headers} from 'next/headers';

function resolveProtocol(host: string, headersList: Headers): string {
  const forwardedProto = headersList.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto;
  }

  return host.includes('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
}

export async function internalFetch(path: string, init?: RequestInit): Promise<Response> {
  const headersList = headers();
  const cookieStore = cookies();

  const host = headersList.get('x-forwarded-host') ?? headersList.get('host');
  if (!host) {
    throw new Error('Missing host header');
  }

  const protocol = resolveProtocol(host, headersList);
  const cookieHeader = cookieStore
    .getAll()
    .map(({name, value}) => `${name}=${value}`)
    .join('; ');

  const url = path.startsWith('http') ? path : `${protocol}://${host}${path.startsWith('/') ? path : `/${path}`}`;

  const headersInit = new Headers(init?.headers ?? {});
  if (cookieHeader && !headersInit.has('cookie')) {
    headersInit.set('cookie', cookieHeader);
  }

  if (init?.body && !headersInit.has('content-type')) {
    headersInit.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...init,
    headers: headersInit,
    cache: 'no-store',
    next: { revalidate: 0 }
  });
}

export async function internalFetchJson<T>(path: string, init?: RequestInit): Promise<{
  data: T | null;
  error?: string;
  status?: number;
}> {
  try {
    const response = await internalFetch(path, init);
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      if (isJson) {
        const body = await response.json().catch(() => ({}));
        const message = typeof body?.message === 'string' ? body.message : 'Request failed';
        return { data: null, error: message, status: response.status };
      }

      return { data: null, error: 'Request failed', status: response.status };
    }

    if (!isJson) {
      return { data: null, error: 'Response was not JSON', status: response.status };
    }

    const data = (await response.json()) as T;
    return { data, status: response.status };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Request failed' };
  }
}
