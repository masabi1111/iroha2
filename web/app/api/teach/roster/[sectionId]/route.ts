import {NextRequest, NextResponse} from 'next/server';

import {authorizedFetch} from '@/lib/server/api';

import {forwardProxyResponse} from '../../utils';

export async function GET(_: NextRequest, {params}: { params: { sectionId: string } }) {
  const {sectionId} = params;

  if (!sectionId) {
    return NextResponse.json({ message: 'sectionId is required' }, { status: 400 });
  }

  try {
    const search = new URLSearchParams({ sectionId: String(sectionId) });
    const response = await authorizedFetch(`/enrollments?${search.toString()}`, { method: 'GET' });
    return forwardProxyResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load roster';
    return NextResponse.json({ message }, { status: 500 });
  }
}
