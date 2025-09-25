import Link from 'next/link';

import {fetchSeasons} from '@/lib/api';
import {formatDateRange} from '@/lib/format';
import {detectRequestLocale, getTranslator} from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;
  return {
    title: t('seasonsPage.title'),
    description: t('seasonsPage.description')
  };
}

export default async function SeasonsPage() {
  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;
  const {seasons, error} = await fetchSeasons();

  if (error && seasons.length === 0) {
    return <div className="error-state">{t('errors.generic')}</div>;
  }

  if (seasons.length === 0) {
    return <div className="empty-state">{t('empty.seasons')}</div>;
  }

  return (
    <section>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>{t('seasonsPage.title')}</h1>
        <p style={{ color: '#4b5563', marginTop: '0.5rem', maxWidth: '36rem' }}>{t('seasonsPage.description')}</p>
      </header>

      <div className="card-grid">
        {seasons.map((season) => {
          const enrollmentRange = formatDateRange({
            start: season.enrollmentOpen,
            end: season.enrollmentClose,
            locale,
            includeYear: true
          });

          const runRange = formatDateRange({
            start: season.startDate,
            end: season.endDate,
            locale,
            includeYear: true
          });

          const [enrollmentStart, enrollmentEnd] = enrollmentRange?.split(' – ') ?? [];
          const [runStart, runEnd] = runRange?.split(' – ') ?? [];

          return (
            <article key={season.code} className="card">
              <span className="badge">{season.code}</span>
              <h2>{season.title}</h2>
              {enrollmentStart && enrollmentEnd ? (
                <p style={{ margin: 0 }}>{t('seasonsPage.enrollmentWindow', { start: enrollmentStart, end: enrollmentEnd })}</p>
              ) : null}
              {runStart && runEnd ? (
                <p style={{ margin: 0 }}>{t('seasonsPage.runWindow', { start: runStart, end: runEnd })}</p>
              ) : null}
              <footer>
                <Link className="button" href={`/seasons/${season.code}`} prefetch>
                  {t('actions.browseCourses')}
                </Link>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}
