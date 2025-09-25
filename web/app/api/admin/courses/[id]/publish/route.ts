import {NextRequest, NextResponse} from 'next/server';

import {authorizedFetch} from '@/lib/server/api';

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const response = await authorizedFetch(`/courses/${encodeURIComponent(params.id)}/publish`, {
    method: 'POST'
  });
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
