'use client';

import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {useTranslations} from 'next-intl';

type PublishedToggleProps = {
  courseId: string;
  initialPublished: boolean;
};

export function PublishedToggle({ courseId, initialPublished }: PublishedToggleProps) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [published, setPublished] = useState(initialPublished);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setLoading(true);
    setError(null);
    const nextValue = !published;

    const response = await fetch(`/api/admin/courses/${courseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: nextValue })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message ?? t('messages.error'));
      setLoading(false);
      return;
    }

    setPublished(nextValue);
    setLoading(false);
    router.refresh();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        style={{
          borderRadius: '999px',
          border: '1px solid #d1d5db',
          padding: '0.35rem 0.75rem',
          backgroundColor: published ? '#2563eb' : '#f3f4f6',
          color: published ? 'white' : '#1f2937',
          fontWeight: 600,
          cursor: 'pointer'
        }}
        aria-pressed={published}
      >
        {published ? t('courses.published.true') : t('courses.published.false')}
      </button>
      {error ? <span style={{ color: '#b91c1c', fontSize: '0.8rem' }}>{error}</span> : null}
    </div>
  );
}
