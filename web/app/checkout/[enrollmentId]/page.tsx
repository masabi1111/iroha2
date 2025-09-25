import Link from 'next/link';
import {cookies, headers} from 'next/headers';
import {redirect} from 'next/navigation';

import type {PaymentIntentResponse} from '@/types/api';
import {detectRequestLocale, getTranslator} from '@/lib/i18n';

export const dynamic = 'force-dynamic';

interface CheckoutPageProps {
  params: { enrollmentId: string };
}

async function loadIntent(enrollmentId: string): Promise<{ data: PaymentIntentResponse | null; error?: string }> {
  const headersList = headers();
  const cookieStore = cookies();

  const host = headersList.get('x-forwarded-host') ?? headersList.get('host');
  if (!host) {
    return { data: null, error: 'Missing host header' };
  }

  const protocol = headersList.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
  const cookieHeader = cookieStore
    .getAll()
    .map(({name, value}) => `${name}=${value}`)
    .join('; ');

  try {
    const response = await fetch(`${protocol}://${host}/api/payments/${encodeURIComponent(enrollmentId)}/intent`, {
      method: 'POST',
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      if (isJson) {
        const body = await response.json().catch(() => ({}));
        return { data: null, error: typeof body.message === 'string' ? body.message : 'Unable to load payment intent' };
      }

      return { data: null, error: 'Unable to load payment intent' };
    }

    if (!isJson) {
      return { data: null, error: 'Payment intent response was not JSON' };
    }

    const data = (await response.json()) as PaymentIntentResponse;
    return { data };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unable to load payment intent' };
  }
}

export default async function CheckoutPage({params}: CheckoutPageProps) {
  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;

  const {data, error} = await loadIntent(params.enrollmentId);

  if (error) {
    return <div className="error-state">{t('checkoutPage.error')}</div>;
  }

  if (!data) {
    return <div className="error-state">{t('checkoutPage.error')}</div>;
  }

  if (data.checkoutUrl && data.provider !== 'mock') {
    redirect(data.checkoutUrl);
  }

  return (
    <section className="card" style={{ gap: '1rem' }}>
      <h1 style={{ margin: 0 }}>{t('checkoutPage.title')}</h1>
      <p style={{ margin: 0, color: '#4b5563' }}>{t('checkoutPage.description')}</p>
      {data.checkoutUrl ? (
        <a className="button" href={data.checkoutUrl ?? '#'} target="_blank" rel="noreferrer">
          {t('checkoutPage.openCheckout')}
        </a>
      ) : (
        <p style={{ margin: 0, color: '#b91c1c' }}>{t('checkoutPage.missingUrl')}</p>
      )}
      {data.providerRef ? (
        <p style={{ margin: 0, color: '#6b7280' }}>{t('checkoutPage.providerRef', { ref: data.providerRef })}</p>
      ) : null}
      <Link href="/dashboard" className="button" style={{ backgroundColor: '#6b7280' }}>
        {t('checkoutPage.dashboardCta')}
      </Link>
    </section>
  );
}
