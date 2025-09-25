import {cookies} from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

export function getAccessToken(): string | undefined {
  const cookieStore = cookies();
  return (
    cookieStore.get('accessToken')?.value ??
    cookieStore.get('token')?.value ??
    cookieStore.get('authToken')?.value
  );
}

export async function authorizedFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!API_BASE_URL) {
    return new Response('API base URL is not configured', { status: 500 });
  }

  const token = getAccessToken();
  const headers = new Headers(init?.headers);

  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
    next: { revalidate: 0 }
  });

  return response;
}

export async function fetchCurrentUser<T = unknown>(): Promise<T | null> {
  const response = await authorizedFetch('/me', { method: 'GET' });
  if (!response.ok) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    return null;
  }
}
