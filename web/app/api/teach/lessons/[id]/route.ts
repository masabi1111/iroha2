import {NextRequest, NextResponse} from 'next/server';

import {authorizedFetch} from '@/lib/server/api';

import {forwardProxyResponse} from '../../utils';

export async function PATCH(request: NextRequest, {params}: { params: { id: string } }) {
  const {id} = params;

  if (!id) {
    return NextResponse.json({ message: 'Lesson id is required' }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ message: 'Request body is required' }, { status: 400 });
  }

  try {
    const response = await authorizedFetch(`/lessons/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });

    return forwardProxyResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update lesson';
    return NextResponse.json({ message }, { status: 500 });
  }
}
