import type {Metadata} from 'next';
import Link from 'next/link';
import {ReactNode} from 'react';

import {IntlProvider} from '@/components/IntlProvider';
import {detectRequestLocale, getMessages, getTranslator} from '@/lib/i18n';

import './globals.css';

export const metadata: Metadata = {
  title: 'Iroha Catalog',
  description: 'Seasonal Japanese language programs for every level.'
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({children}: RootLayoutProps) {
  const locale = detectRequestLocale();
  const messages = getMessages(locale);
  const t = getTranslator(locale) as any;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body>
        <IntlProvider locale={locale} messages={messages}>
          <header style={{ padding: '1.5rem 1rem', borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
            <main style={{ padding: 0, maxWidth: '960px', margin: '0 auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <Link href="/seasons" style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                  {t('layout.appName')}
                </Link>
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
