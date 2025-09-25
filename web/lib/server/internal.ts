import {cookies, headers} from 'next/headers';

function resolveProtocol(host: string | null, headersList: Headers): string {
  const forwardedProto = headersList.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0]!.trim();
  }

  if (host && host.includes('localhost')) {
    return 'http';
  }

  return 'https';
}

export function getInternalBaseUrl(): string | null {
  const headersList = headers();
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host');

  if (!host) {
    return null;
  }

  const protocol = resolveProtocol(host, headersList);
  return `${protocol}://${host}`;
}

export async function internalFetch(path: string, init?: RequestInit): Promise<Response> {
  const baseUrl = getInternalBaseUrl();

  if (!baseUrl) {
    return new Response('Unable to determine base URL', { status: 500 });
  }

  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
  const cookieStore = cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  const headersInit = new Headers(init?.headers);
  if (cookieHeader) {
    headersInit.set('cookie', cookieHeader);
  }

  if (!headersInit.has('accept')) {
    headersInit.set('accept', 'application/json');
  }

  const response = await fetch(url, {
    ...init,
    headers: headersInit,
    cache: 'no-store',
    next: { revalidate: 0 }
  });

  return response;
}
