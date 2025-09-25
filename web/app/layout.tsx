import type {Metadata} from 'next';
import Link from 'next/link';
import {cookies, headers} from 'next/headers';
import {ReactNode} from 'react';

import {IntlProvider} from '@/components/IntlProvider';
import {detectRequestLocale, getMessages, getTranslator} from '@/lib/i18n';
import type {CurrentUserResponse} from '@/types/api';

import './globals.css';

export const metadata: Metadata = {
  title: 'Iroha Catalog',
  description: 'Seasonal Japanese language programs for every level.'
};

type RootLayoutProps = {
  children: ReactNode;
};

async function getCurrentUser(): Promise<CurrentUserResponse | null> {
  try {
    const headersList = headers();
    const cookieStore = cookies();
    const host = headersList.get('x-forwarded-host') ?? headersList.get('host');

    if (!host) {
      return null;
    }

    const protocol = headersList.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
    const cookieHeader = cookieStore
      .getAll()
      .map(({name, value}) => `${name}=${value}`)
      .join('; ');

    const response = await fetch(`${protocol}://${host}/api/auth/me`, {
      method: 'GET',
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as CurrentUserResponse;
  } catch (error) {
    return null;
  }
}

export default async function RootLayout({children}: RootLayoutProps) {
  const locale = detectRequestLocale();
  const messages = getMessages(locale);
  const t = getTranslator(locale) as any;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const currentUser = await getCurrentUser();
  const isAuthenticated = Boolean(currentUser);

  return (
    <html lang={locale} dir={dir}>
      <body>
        <IntlProvider locale={locale} messages={messages}>
          <header style={{ padding: '1.5rem 1rem', borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
            <main style={{ padding: 0, maxWidth: '960px', margin: '0 auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <Link href="/seasons" style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                    {t('layout.appName')}
                  </Link>
                  {isAuthenticated ? (
                    <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <Link href="/dashboard" className="nav-link">
                        {t('layout.nav.dashboard')}
                      </Link>
                      <Link href="/logout" className="nav-link" prefetch={false}>
                        {t('layout.nav.logout')}
                      </Link>
                    </nav>
                  ) : null}
                </div>
                <span style={{ color: '#6b7280' }}>{t('layout.tagline')}</span>
              </div>
            </main>
          </header>
          <main>{children}</main>
        </IntlProvider>
      </body>
    </html>
  );
}
