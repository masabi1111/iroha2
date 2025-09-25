'use client';

import {FormEvent, useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';

import {CheckboxField, SelectField, TextField} from '@/components/admin/form-fields';

type CourseFormValues = {
  seasonId: string;
  code: string;
  title: string;
  level: string;
  modality: string;
  capacity: string;
  priceCents: string;
  currency: string;
  published: boolean;
};

type SeasonOption = {
  id: string;
  code: string;
  title: string;
};

type CourseFormProps = {
  courseId?: string;
  seasons: SeasonOption[];
  initialValues?: Partial<CourseFormValues>;
  submitLabel?: string;
  publishEndpoint?: string;
};

const defaultValues: CourseFormValues = {
  seasonId: '',
  code: '',
  title: '',
  level: 'A0',
  modality: '',
  capacity: '',
  priceCents: '',
  currency: 'USD',
  published: false
};

export function CourseForm({ courseId, seasons, initialValues, submitLabel, publishEndpoint }: CourseFormProps) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [values, setValues] = useState<CourseFormValues>({
    ...defaultValues,
    ...(initialValues ?? {})
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const levelOptions = useMemo(
    () => ['A0', 'A1', 'A2', 'B1', 'B2'].map((level) => ({ value: level, label: level })),
    []
  );

  const seasonOptions = useMemo(
    () =>
      seasons.map((season) => ({
        value: season.id,
        label: `${season.code} — ${season.title}`
      })),
    [seasons]
  );

  const handleChange = (name: keyof CourseFormValues, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      seasonId: values.seasonId || null,
      code: values.code,
      title: values.title,
      level: values.level,
      modality: values.modality || null,
      capacity: values.capacity ? Number(values.capacity) : null,
      priceCents: values.priceCents ? Number(values.priceCents) : null,
      currency: values.currency || 'USD',
      published: values.published
    };

    const response = await fetch(courseId ? `/api/admin/courses/${courseId}` : '/api/admin/courses', {
      method: courseId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message ?? t('messages.error'));
      setSubmitting(false);
      return;
    }

    router.push('/admin/courses');
    router.refresh();
  };

  const handlePublish = async () => {
    if (!publishEndpoint) {
      return;
    }

    setPublishError(null);
    setPublishing(true);

    const response = await fetch(publishEndpoint, { method: 'POST' });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setPublishError(data.message ?? t('messages.error'));
      setPublishing(false);
      return;
    }

    setPublishing(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <SelectField
          name="seasonId"
          label={t('courses.fields.season')}
          value={values.seasonId}
          onChange={(value) => handleChange('seasonId', value)}
          options={seasonOptions}
          placeholder={t('courses.fields.selectSeason')}
          required
        />
        <TextField
          name="code"
          label={t('courses.fields.code')}
          value={values.code}
          onChange={(value) => handleChange('code', value)}
          required
        />
        <TextField
          name="title"
          label={t('courses.fields.title')}
          value={values.title}
          onChange={(value) => handleChange('title', value)}
          required
        />
        <SelectField
          name="level"
          label={t('courses.fields.level')}
          value={values.level}
          onChange={(value) => handleChange('level', value)}
          options={levelOptions}
        />
        <TextField
          name="modality"
          label={t('courses.fields.modality')}
          value={values.modality}
          onChange={(value) => handleChange('modality', value)}
        />
        <TextField
          name="capacity"
          label={t('courses.fields.capacity')}
          value={values.capacity}
          onChange={(value) => handleChange('capacity', value)}
          type="number"
        />
        <TextField
          name="priceCents"
          label={t('courses.fields.priceCents')}
          value={values.priceCents}
          onChange={(value) => handleChange('priceCents', value)}
          type="number"
        />
        <TextField
          name="currency"
          label={t('courses.fields.currency')}
          value={values.currency}
          onChange={(value) => handleChange('currency', value)}
        />
      </div>
      <CheckboxField
        name="published"
        label={t('courses.fields.published')}
        checked={values.published}
        onChange={(checked) => handleChange('published', checked)}
      />
      {error ? <div className="error-state">{error}</div> : null}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? t('actions.saving') : submitLabel ?? t('actions.save')}
        </button>
        {publishEndpoint ? (
          <button
            type="button"
            className="button"
            onClick={handlePublish}
            disabled={publishing}
            style={{ backgroundColor: '#16a34a' }}
          >
            {publishing ? t('actions.publishing') : t('actions.publish')}
          </button>
        ) : null}
      </div>
      {publishError ? <div className="error-state">{publishError}</div> : null}
    </form>
  );
}
