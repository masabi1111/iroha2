import {NextRequest, NextResponse} from 'next/server';

import {authorizedFetch} from '@/lib/server/api';
import type {PaymentIntentResponse} from '@/types/api';

const RETURN_URL = process.env.NEXT_PUBLIC_RETURN_URL;

export async function POST(_: NextRequest, {params}: { params: { enrollmentId: string } }) {
  const {enrollmentId} = params;

  if (!enrollmentId) {
    return NextResponse.json({ message: 'enrollmentId is required' }, { status: 400 });
  }

  const body: Record<string, unknown> = {};
  if (RETURN_URL) {
    body.returnUrl = RETURN_URL;
  }

  const response = await authorizedFetch(`/payments/${encodeURIComponent(enrollmentId)}/intent`, {
    method: 'POST',
    body: JSON.stringify(body)
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

  const data: PaymentIntentResponse = isJson ? await response.json() : ({} as PaymentIntentResponse);

  return NextResponse.json(
    {
      checkoutUrl: data.checkoutUrl,
      providerRef: data.providerRef,
      provider: data.provider
    },
    { status: response.status }
  );
}
