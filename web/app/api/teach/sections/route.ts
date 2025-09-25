import {NextRequest, NextResponse} from 'next/server';

import {authorizedFetch, fetchCurrentUser} from '@/lib/server/api';

import {forwardProxyResponse} from '../utils';

function shouldFallback(status: number): boolean {
  if (status === 400 || status === 404 || status === 422 || status === 405) {
    return true;
  }

  return false;
}

export async function GET(_: NextRequest) {
  try {
    let response = await authorizedFetch('/sections?mine=true', { method: 'GET' });

    if (!response.ok && shouldFallback(response.status)) {
      const currentUser = await fetchCurrentUser<{ id?: string }>();

      if (!currentUser?.id) {
        return NextResponse.json({ message: 'Unable to identify instructor account' }, { status: 403 });
      }

      const search = new URLSearchParams({ instructorId: String(currentUser.id) });
      response = await authorizedFetch(`/sections?${search.toString()}`, { method: 'GET' });
    }

    return forwardProxyResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load sections';
    return NextResponse.json({ message }, { status: 500 });
  }
}
