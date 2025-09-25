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

export async function GET(request: NextRequest) {
  if (!API_BASE_URL) {
    return NextResponse.json({ message: 'API base URL is not configured' }, { status: 500 });
  }

  const token = getAccessToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const {searchParams} = new URL(request.url);
  const courseId = searchParams.get('courseId');

  if (!courseId) {
    return NextResponse.json({ message: 'courseId is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/quizzes?courseId=${encodeURIComponent(courseId)}`, {
      method: 'GET',
      headers: buildHeaders(token),
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (response.status === 404) {
      return NextResponse.json([], { status: 200 });
    }

    const contentType = response.headers.get('content-type') ?? 'application/json';
    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        'content-type': contentType
      }
    });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to reach quizzes service' }, { status: 502 });
  }
}
