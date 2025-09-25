'use client';

import {NextIntlClientProvider} from 'next-intl';
import type {ReactNode} from 'react';

import type {Locale} from '@/lib/i18n';

type IntlProviderProps = {
  locale: Locale;
  messages: Record<string, unknown>;
  children: ReactNode;
};

export function IntlProvider({locale, messages, children}: IntlProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Riyadh">
      {children}
    </NextIntlClientProvider>
  );
}
