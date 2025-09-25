import {NextResponse} from 'next/server';

export async function forwardProxyResponse(response: Response): Promise<NextResponse> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      const body = await response.json().catch(() => ({}));
      return NextResponse.json(body, { status: response.status });
    }

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: {
        'content-type': contentType ?? 'text/plain'
      }
    });
  }

  if (!isJson) {
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: {
        'content-type': contentType ?? 'text/plain'
      }
    });
  }

  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
