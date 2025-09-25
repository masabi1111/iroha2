import Link from 'next/link';
import type {ReactNode} from 'react';

import {requireRole} from '@/lib/roles';
import {detectRequestLocale, getTranslator} from '@/lib/i18n';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole('admin');
  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;

  const links = [
    { href: '/admin', label: t('admin.links.overview') },
    { href: '/admin/seasons', label: t('admin.links.seasons') },
    { href: '/admin/courses', label: t('admin.links.courses') },
    { href: '/admin/sections/new', label: t('admin.links.sections') },
    { href: '/admin/reports/enrollment', label: t('admin.links.reports') }
  ];

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          padding: '1.25rem 1.5rem',
          borderRadius: '1rem',
          backgroundColor: '#111827',
          color: 'white'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>{t('admin.title')}</h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)' }}>{t('admin.description')}</p>
        </div>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="button"
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                padding: '0.5rem 0.9rem',
                borderRadius: '999px',
                fontWeight: 500
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 10px 25px -20px rgba(15, 23, 42, 0.75)' }}>
        {children}
      </div>
    </section>
  );
}
