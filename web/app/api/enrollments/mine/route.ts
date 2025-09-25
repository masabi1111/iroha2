import {cookies} from 'next/headers';
import {NextRequest, NextResponse} from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

function getAccessToken(): string | null {
  return cookies().get('accessToken')?.value ?? null;
}

function buildHeaders(token: string): Headers {
  const headers = new Headers();
  headers.set('Accept', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

export async function GET(_request: NextRequest) {
  if (!API_BASE_URL) {
    return NextResponse.json({ message: 'API base URL is not configured' }, { status: 500 });
  }

  const token = getAccessToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/enrollments/mine`, {
      method: 'GET',
      headers: buildHeaders(token),
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    const contentType = response.headers.get('content-type') ?? 'application/json';
    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        'content-type': contentType
      }
    });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to reach enrollment service' }, { status: 502 });
  }
}
