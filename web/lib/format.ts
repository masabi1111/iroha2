import type {Locale} from '@/lib/i18n';

const localeMap: Record<Locale, string> = {
  ar: 'ar-SA',
  en: 'en-US',
  ja: 'ja-JP'
};

function resolveDateLocale(locale: Locale): string {
  return localeMap[locale] ?? 'en-US';
}

export function formatDateRange({
  start,
  end,
  locale,
  includeYear = false
}: {
  start?: string | null;
  end?: string | null;
  locale: Locale;
  includeYear?: boolean;
}): string | null {
  if (!start || !end) {
    return null;
  }

  const intlLocale = resolveDateLocale(locale);
  const options: Intl.DateTimeFormatOptions = includeYear
    ? { month: 'short', day: 'numeric', year: 'numeric' }
    : { month: 'short', day: 'numeric' };

  try {
    const formatter = new Intl.DateTimeFormat(intlLocale, options);
    return `${formatter.format(new Date(start))} – ${formatter.format(new Date(end))}`;
  } catch {
    return null;
  }
}

export function formatTimeRange({
  start,
  end,
  locale
}: {
  start?: string | null;
  end?: string | null;
  locale: Locale;
}): string | null {
  if (!start || !end) {
    return null;
  }

  const intlLocale = resolveDateLocale(locale);
  const normalise = (value: string) => (value.includes('T') ? value : `1970-01-01T${value}`);
  try {
    const formatter = new Intl.DateTimeFormat(intlLocale, {
      hour: 'numeric',
      minute: '2-digit'
    });

    return `${formatter.format(new Date(normalise(start)))} – ${formatter.format(new Date(normalise(end)))}`;
  } catch {
    try {
      const fallbackFormatter = new Intl.DateTimeFormat(intlLocale, {
        hour: 'numeric',
        minute: '2-digit'
      });
      return `${fallbackFormatter.format(new Date(normalise(start)))} – ${fallbackFormatter.format(
        new Date(normalise(end))
      )}`;
    } catch {
      return null;
    }
  }
}

export function formatCurrency({
  amountCents,
  currency = 'SAR',
  locale
}: {
  amountCents?: number;
  currency?: string;
  locale: Locale;
}): string | null {
  if (amountCents == null) {
    return null;
  }

  const intlLocale = resolveDateLocale(locale);
  try {
    const formatter = new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    });
    return formatter.format(amountCents / 100);
  } catch {
    return `${currency} ${(amountCents / 100).toFixed(0)}`;
  }
}

export function combineName({
  firstName,
  lastName,
  displayName
}: {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
}): string | null {
  if (displayName) {
    return displayName;
  }

  const parts = [firstName, lastName].filter(Boolean);
  if (parts.length) {
    return parts.join(' ');
  }

  return null;
}
