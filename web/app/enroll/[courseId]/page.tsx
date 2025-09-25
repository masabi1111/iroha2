import Link from 'next/link';

import {fetchCourseById, fetchSectionsByCourse} from '@/lib/api';
import {formatCurrency} from '@/lib/format';
import {detectRequestLocale, getTranslator} from '@/lib/i18n';

import {EnrollForm} from './EnrollForm';

export const dynamic = 'force-dynamic';

interface EnrollPageProps {
  params: { courseId: string };
}

export default async function EnrollPage({params}: EnrollPageProps) {
  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;

  const [{course}, {sections}] = await Promise.all([
    fetchCourseById(params.courseId),
    fetchSectionsByCourse(params.courseId)
  ]);

  if (!course) {
    return <div className="error-state">{t('errors.generic')}</div>;
  }

  const priceLabel = formatCurrency({ amountCents: course.priceCents, currency: course.currency, locale });

  return (
    <article className="card" style={{ padding: '2rem', gap: '1.5rem' }}>
      <header>
        <Link href={`/courses/${course.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb' }}>
          ← {t('actions.view')}
        </Link>
        <h1 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>{t('enrollPage.title', { title: course.title })}</h1>
        {priceLabel ? <p style={{ margin: 0, color: '#4b5563' }}>{t('enrollPage.price', { price: priceLabel })}</p> : null}
      </header>

      <EnrollForm
        courseId={course.id}
        sections={sections}
        labels={{
          submit: t('enrollPage.submit'),
          sectionLabel: t('enrollPage.sectionLabel'),
          sectionPlaceholder: t('enrollPage.sectionPlaceholder'),
          noSections: t('enrollPage.noSections'),
          optional: t('enrollPage.optional'),
          waitlistedTitle: t('enrollPage.waitlistedTitle'),
          waitlistedDescription: t('enrollPage.waitlistedDescription'),
          waitlistedSeats: t('enrollPage.waitlistedSeats'),
          dashboardCta: t('enrollPage.dashboardCta'),
          successToast: t('enrollPage.successToast'),
          errorToast: t('enrollPage.errorToast'),
          loading: t('enrollPage.loading')
        }}
      />
    </article>
  );
}
