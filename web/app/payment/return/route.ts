import {NextRequest, NextResponse} from 'next/server';

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status');
  const providerRef =
    request.nextUrl.searchParams.get('providerRef') ?? request.nextUrl.searchParams.get('provider_ref');

  const details: string[] = [];
  if (status) {
    details.push(`Status: ${status}`);
  }
  if (providerRef) {
    details.push(`Reference: ${providerRef}`);
  }

  const info = details.length ? `<p style="margin:0.5rem 0 0; color:#6b7280;">${details.join(' · ')}</p>` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <title>Payment return</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 2rem; }
      main { max-width: 480px; margin: 4rem auto; background: white; border-radius: 1rem; padding: 2rem; box-shadow: 0 10px 20px -15px rgba(15, 23, 42, 0.45); border: 1px solid rgba(15, 23, 42, 0.05); text-align: center; }
      a.button { display: inline-flex; align-items: center; justify-content: center; background: #2563eb; color: white; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 600; margin-top: 1.5rem; text-decoration: none; }
    </style>
  </head>
  <body>
    <main>
      <h1 style="margin-top:0">We are verifying your payment…</h1>
      <p style="color:#4b5563; margin-bottom:1rem;">You can return to your dashboard while we confirm the payment status.</p>
      ${info}
      <a class="button" href="/dashboard">Go to dashboard</a>
    </main>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8'
    }
  });
}
