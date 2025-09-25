import Link from 'next/link';

import {fetchCourseById, fetchSectionsByCourse} from '@/lib/api';
import {combineName, formatCurrency, formatDateRange, formatTimeRange} from '@/lib/format';
import {detectRequestLocale, getTranslator} from '@/lib/i18n';

export const dynamic = 'force-dynamic';

interface CoursePageProps {
  params: { id: string };
}

export async function generateMetadata({params}: CoursePageProps) {
  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;
  const {course} = await fetchCourseById(params.id);
  const title = course?.title ?? params.id;

  return {
    title,
    description: t('coursePage.metaDescription', { title })
  };
}

export default async function CoursePage({params}: CoursePageProps) {
  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;

  const [{course}, {sections, error: sectionsError}] = await Promise.all([
    fetchCourseById(params.id),
    fetchSectionsByCourse(params.id)
  ]);

  if (!course) {
    return <div className="error-state">{t('errors.generic')}</div>;
  }

  const seatsLabel = typeof course.seatsLeft === 'number' ? t('coursePage.seatsLeft', { count: course.seatsLeft }) : null;
  const priceLabel = formatCurrency({ amountCents: course.priceCents, currency: course.currency, locale });

  return (
    <article className="card" style={{ padding: '2rem' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <span className="badge">{course.code}</span>
        <h1 style={{ margin: 0, fontSize: '2.25rem' }}>{course.title}</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: '#4b5563' }}>
          {course.level ? <span>{t('coursePage.level')}: {course.level}</span> : null}
          {priceLabel ? <span>{t('coursePage.price')}: {priceLabel}</span> : null}
          {seatsLabel ? <span>{seatsLabel}</span> : null}
        </div>
      </header>

      {course.description ? (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0 }}>{t('coursePage.description')}</h2>
          <p style={{ color: '#374151', lineHeight: 1.7 }}>{course.description}</p>
        </section>
      ) : null}

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginTop: 0 }}>{t('coursePage.sectionsTitle')}</h2>
        {sectionsError && sections.length === 0 ? (
          <div className="error-state">{t('errors.sections')}</div>
        ) : sections.length === 0 ? (
          <div className="empty-state">{t('empty.sections')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sections.map((section) => {
              const weekdayLabel =
                section.weekday != null ? t(`weekdays.${section.weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6}`) : null;
              const timeRange = formatTimeRange({
                start: section.startTime ?? undefined,
                end: section.endTime ?? undefined,
                locale
              });
              const [timeStart, timeEnd] = timeRange?.split(' – ') ?? [];
              const scheduleLabel =
                weekdayLabel && timeStart && timeEnd
                  ? t('coursePage.schedule', { weekday: weekdayLabel, start: timeStart, end: timeEnd })
                  : timeRange ?? weekdayLabel ?? '';
              const sessionRange = formatDateRange({
                start: section.startDate ?? undefined,
                end: section.endDate ?? undefined,
                locale,
                includeYear: true
              });
              const instructorName = combineName({
                firstName: section.instructor?.firstName,
                lastName: section.instructor?.lastName,
                displayName: section.instructor?.displayName
              });

              return (
                <div key={section.id} className="card" style={{ margin: 0 }}>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{section.title ?? weekdayLabel ?? t('coursePage.sectionsTitle')}</h3>
                  {scheduleLabel ? <p style={{ margin: 0 }}>{scheduleLabel}</p> : null}
                  {sessionRange ? <p style={{ margin: 0, color: '#6b7280' }}>{sessionRange}</p> : null}
                  <p style={{ margin: 0, color: '#4b5563' }}>
                    {instructorName
                      ? t('coursePage.instructor', { name: instructorName })
                      : t('coursePage.unassignedInstructor')}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer>
        <Link className="button" href={`/enroll/${course.id}`} prefetch>
          {t('actions.enroll')}
        </Link>
      </footer>
    </article>
  );
}
