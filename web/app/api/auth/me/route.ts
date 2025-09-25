import {NextRequest, NextResponse} from 'next/server';

import {authorizedFetch} from '@/lib/server/api';
import type {CurrentUserResponse} from '@/types/api';

export async function GET(_: NextRequest) {
  const response = await authorizedFetch('/me', { method: 'GET' });
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
      headers: {
        'content-type': contentType ?? 'text/plain'
      }
    });
  }

  const data: CurrentUserResponse = isJson ? await response.json() : ({} as CurrentUserResponse);

  return NextResponse.json(data, { status: response.status });
}
