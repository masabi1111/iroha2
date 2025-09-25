import Link from 'next/link';

import {fetchCoursesBySeason, fetchSeasonByCode} from '@/lib/api';
import {formatCurrency} from '@/lib/format';
import {detectRequestLocale, getTranslator} from '@/lib/i18n';

export const dynamic = 'force-dynamic';

interface SeasonCoursesPageProps {
  params: { code: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({params}: { params: { code: string } }) {
  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;
  const {season} = await fetchSeasonByCode(params.code);
  const seasonName = season?.title ?? params.code;

  return {
    title: t('seasonCoursesPage.title', { season: seasonName }),
    description: t('seasonCoursesPage.description', { season: seasonName })
  };
}

function parseNumber(value?: string | string[]): number | undefined {
  if (Array.isArray(value)) {
    return parseNumber(value[0]);
  }

  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function SeasonCoursesPage({params, searchParams}: SeasonCoursesPageProps) {
  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;

  const page = parseNumber(searchParams?.page) ?? 1;
  const size = parseNumber(searchParams?.size) ?? 20;

  const buildQuery = (pageNumber: number) => {
    const query: Record<string, string> = {};
    if (searchParams) {
      for (const [key, value] of Object.entries(searchParams)) {
        if (value == null) continue;
        if (Array.isArray(value)) {
          if (value[0]) {
            query[key] = value[0];
          }
        } else {
          query[key] = value;
        }
      }
    }
    query.page = String(pageNumber);
    if (!query.size) {
      query.size = String(size);
    }
    return query;
  };

  const [{season}, coursesResult] = await Promise.all([
    fetchSeasonByCode(params.code),
    fetchCoursesBySeason({ code: params.code, page, size })
  ]);

  const seasonName = season?.title ?? params.code;

  if (coursesResult.error && coursesResult.items.length === 0) {
    return <div className="error-state">{t('errors.generic')}</div>;
  }

  if (coursesResult.items.length === 0) {
    return (
      <section>
        <header style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>{t('seasonCoursesPage.title', { season: seasonName })}</h1>
          <p style={{ color: '#4b5563', marginTop: '0.5rem', maxWidth: '36rem' }}>
            {t('seasonCoursesPage.description', { season: seasonName })}
          </p>
        </header>
        <div className="empty-state">{t('empty.courses')}</div>
      </section>
    );
  }

  const {items: courses, meta} = coursesResult;

  const prevPage = meta.page > 1 ? meta.page - 1 : null;
  const hasNext = meta.pageCount ? meta.page < meta.pageCount : courses.length === meta.size;
  const nextPage = hasNext ? meta.page + 1 : null;

  return (
    <section>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>{t('seasonCoursesPage.title', { season: seasonName })}</h1>
        <p style={{ color: '#4b5563', marginTop: '0.5rem', maxWidth: '36rem' }}>
          {t('seasonCoursesPage.description', { season: seasonName })}
        </p>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table className="list-table">
          <thead>
            <tr>
              <th>{t('seasonCoursesPage.table.code')}</th>
              <th>{t('seasonCoursesPage.table.course')}</th>
              <th>{t('seasonCoursesPage.table.level')}</th>
              <th>{t('seasonCoursesPage.table.price')}</th>
              <th>{t('seasonCoursesPage.table.seats')}</th>
              <th>{t('seasonCoursesPage.table.action')}</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.code}</td>
                <td>{course.title}</td>
                <td>{course.level ?? '—'}</td>
                <td>{formatCurrency({ amountCents: course.priceCents, currency: course.currency, locale }) ?? '—'}</td>
                <td>{course.seatsLeft ?? '—'}</td>
                <td>
                  <Link className="button" href={`/courses/${course.id}`} prefetch>
                    {t('actions.view')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
        <span style={{ color: '#6b7280' }}>
          {t('seasonCoursesPage.pagination', { page: meta.page, pages: meta.pageCount || meta.page })}
        </span>
        <div className="actions">
          <Link
            aria-disabled={!prevPage}
            className="button"
            href={{ pathname: `/seasons/${params.code}`, query: buildQuery(prevPage ?? meta.page) }}
            prefetch
            style={{ opacity: prevPage ? 1 : 0.5, pointerEvents: prevPage ? 'auto' : 'none' }}
            aria-label={t('seasonCoursesPage.previous')}
          >
            ←
          </Link>
          <Link
            aria-disabled={!nextPage}
            className="button"
            href={{ pathname: `/seasons/${params.code}`, query: buildQuery(nextPage ?? meta.page) }}
            prefetch
            style={{ opacity: nextPage ? 1 : 0.5, pointerEvents: nextPage ? 'auto' : 'none' }}
            aria-label={t('seasonCoursesPage.next')}
          >
            →
          </Link>
        </div>
      </nav>
    </section>
  );
}
