import {NextRequest, NextResponse} from 'next/server';

import {authorizedFetch} from '@/lib/server/api';

async function proxy(path: string, init: RequestInit) {
  const response = await authorizedFetch(path, init);
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(error, { status: response.status });
    }

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { 'content-type': contentType ?? 'text/plain' }
    });
  }

  if (!isJson) {
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { 'content-type': contentType ?? 'text/plain' }
    });
  }

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search;
  return proxy(`/courses${search}`, { method: 'GET' });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxy(`/courses`, {
    method: 'POST',
    body: body || undefined
  });
}
