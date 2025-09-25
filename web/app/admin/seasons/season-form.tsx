'use client';

import {useRouter} from 'next/navigation';
import {FormEvent, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';

import {DateField, SelectField, TextField} from '@/components/admin/form-fields';

type SeasonFormValues = {
  code: string;
  title: string;
  enrollmentOpen: string;
  enrollmentClose: string;
  startDate: string;
  endDate: string;
  status: string;
};

type SeasonFormProps = {
  seasonId?: string;
  initialValues?: Partial<SeasonFormValues>;
  submitLabel?: string;
};

const defaultValues: SeasonFormValues = {
  code: '',
  title: '',
  enrollmentOpen: '',
  enrollmentClose: '',
  startDate: '',
  endDate: '',
  status: 'draft'
};

export function SeasonForm({ seasonId, initialValues, submitLabel }: SeasonFormProps) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [values, setValues] = useState<SeasonFormValues>({
    ...defaultValues,
    ...(initialValues ?? {})
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = useMemo(
    () => [
      { value: 'draft', label: t('seasons.status.draft') },
      { value: 'enrolling', label: t('seasons.status.enrolling') },
      { value: 'running', label: t('seasons.status.running') },
      { value: 'completed', label: t('seasons.status.completed') },
      { value: 'archived', label: t('seasons.status.archived') }
    ],
    [t]
  );

  const handleChange = (name: keyof SeasonFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      code: values.code,
      title: values.title,
      enrollmentOpen: values.enrollmentOpen || null,
      enrollmentClose: values.enrollmentClose || null,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      status: values.status
    };

    const response = await fetch(seasonId ? `/api/admin/seasons/${seasonId}` : '/api/admin/seasons', {
      method: seasonId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message ?? t('messages.error'));
      setSubmitting(false);
      return;
    }

    router.push('/admin/seasons');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <TextField
          name="code"
          label={t('seasons.fields.code')}
          value={values.code}
          onChange={(value) => handleChange('code', value)}
          required
        />
        <TextField
          name="title"
          label={t('seasons.fields.title')}
          value={values.title}
          onChange={(value) => handleChange('title', value)}
          required
        />
        <DateField
          name="enrollmentOpen"
          label={t('seasons.fields.enrollmentOpen')}
          value={values.enrollmentOpen ?? ''}
          onChange={(value) => handleChange('enrollmentOpen', value)}
        />
        <DateField
          name="enrollmentClose"
          label={t('seasons.fields.enrollmentClose')}
          value={values.enrollmentClose ?? ''}
          onChange={(value) => handleChange('enrollmentClose', value)}
        />
        <DateField
          name="startDate"
          label={t('seasons.fields.startDate')}
          value={values.startDate ?? ''}
          onChange={(value) => handleChange('startDate', value)}
        />
        <DateField
          name="endDate"
          label={t('seasons.fields.endDate')}
          value={values.endDate ?? ''}
          onChange={(value) => handleChange('endDate', value)}
        />
        <SelectField
          name="status"
          label={t('seasons.fields.status')}
          value={values.status}
          onChange={(value) => handleChange('status', value)}
          options={statusOptions}
        />
      </div>
      {error ? <div className="error-state">{error}</div> : null}
      <button type="submit" className="button" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
        {submitting ? t('actions.saving') : submitLabel ?? t('actions.save')}
      </button>
    </form>
  );
}
