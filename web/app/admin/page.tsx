import Link from 'next/link';

import {detectRequestLocale, getTranslator} from '@/lib/i18n';

export default async function AdminHomePage() {
  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;

  const sections = [
    {
      title: t('admin.links.seasons'),
      description: t('admin.overview.seasons'),
      href: '/admin/seasons'
    },
    {
      title: t('admin.links.courses'),
      description: t('admin.overview.courses'),
      href: '/admin/courses'
    },
    {
      title: t('admin.links.sections'),
      description: t('admin.overview.sections'),
      href: '/admin/sections/new'
    },
    {
      title: t('admin.links.reports'),
      description: t('admin.overview.reports'),
      href: '/admin/reports/enrollment'
    }
  ];

  return (
    <div className="card-grid">
      {sections.map((section) => (
        <article key={section.href} className="card">
          <h2>{section.title}</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>{section.description}</p>
          <footer>
            <Link className="button" href={section.href} prefetch={false}>
              {t('admin.actions.view')}
            </Link>
          </footer>
        </article>
      ))}
    </div>
  );
}
