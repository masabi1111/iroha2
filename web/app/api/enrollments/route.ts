import {NextRequest, NextResponse} from 'next/server';

import {authorizedFetch} from '@/lib/server/api';
import type {EnrollResponse} from '@/types/api';

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);

  if (!payload || !payload.courseId) {
    return NextResponse.json({ message: 'courseId is required' }, { status: 400 });
  }

  const response = await authorizedFetch('/enrollments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      const errorBody = await response.json().catch(() => ({}));
      return NextResponse.json(errorBody, { status: response.status });
    }

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: {
        'content-type': contentType ?? 'text/plain'
      }
    });
  }

  const data: EnrollResponse = isJson ? await response.json() : ({} as EnrollResponse);

  return NextResponse.json(
    {
      enrollmentId: data.enrollmentId,
      status: data.status,
      seats_left: data.seats_left ?? data.seatsLeft ?? null
    },
    { status: response.status }
  );
}
