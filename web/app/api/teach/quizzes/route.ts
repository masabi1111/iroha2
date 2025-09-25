import {NextRequest, NextResponse} from 'next/server';

import {authorizedFetch} from '@/lib/server/api';

import {forwardProxyResponse} from '../utils';

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ message: 'Request body is required' }, { status: 400 });
  }

  try {
    const response = await authorizedFetch('/quizzes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return forwardProxyResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create quiz';
    return NextResponse.json({ message }, { status: 500 });
  }
}
