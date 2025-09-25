import {createTranslator} from 'next-intl';
import {headers} from 'next/headers';

import ar from '@/messages/ar.json';
import en from '@/messages/en.json';
import ja from '@/messages/ja.json';

type Messages = typeof en;

export const supportedLocales = ['ar', 'en', 'ja'] as const;
export type Locale = (typeof supportedLocales)[number];

const messagesByLocale: Record<Locale, Messages> = {
  ar,
  en,
  ja
};

const defaultLocale: Locale = 'en';

export function resolveLocale(input?: string | null): Locale {
  if (!input) {
    return defaultLocale;
  }

  const normalized = input.trim().toLowerCase();
  const exact = supportedLocales.find((locale) => locale === normalized);
  if (exact) {
    return exact;
  }

  const base = normalized.split('-')[0];
  const baseMatch = supportedLocales.find((locale) => locale === base);
  return baseMatch ?? defaultLocale;
}

export function detectRequestLocale(): Locale {
  const acceptLanguage = headers().get('accept-language');
  if (!acceptLanguage) {
    return defaultLocale;
  }

  const parts = acceptLanguage.split(',');
  for (const part of parts) {
    const [locale] = part.trim().split(';');
    const resolved = resolveLocale(locale);
    if (resolved) {
      return resolved;
    }
  }

  return defaultLocale;
}

export function getMessages(locale: Locale): Messages {
  return messagesByLocale[locale];
}

export function getTranslator(locale?: string) {
  const resolvedLocale = resolveLocale(locale ?? detectRequestLocale());
  return createTranslator({
    locale: resolvedLocale,
    messages: messagesByLocale[resolvedLocale]
  });
}
