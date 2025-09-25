'use client';

import {FormEvent, useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';

import {DateField, SelectField, TextField} from '@/components/admin/form-fields';

type SectionFormValues = {
  courseId: string;
  instructorId: string;
  weekday: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  meetingLink: string;
};

const defaultValues: SectionFormValues = {
  courseId: '',
  instructorId: '',
  weekday: '',
  startTime: '',
  endTime: '',
  startDate: '',
  endDate: '',
  meetingLink: ''
};

export function SectionForm() {
  const t = useTranslations('admin');
  const router = useRouter();
  const [values, setValues] = useState<SectionFormValues>(defaultValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekdayOptions = useMemo(
    () =>
      ['0', '1', '2', '3', '4', '5', '6'].map((value) => ({
        value,
        label: t(`sections.weekdays.${value}`)
      })),
    [t]
  );

  const handleChange = (name: keyof SectionFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      courseId: values.courseId,
      instructorId: values.instructorId || null,
      weekday: values.weekday ? Number(values.weekday) : null,
      startTime: values.startTime || null,
      endTime: values.endTime || null,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      meetingLink: values.meetingLink || null
    };

    const response = await fetch('/api/admin/sections', {
      method: 'POST',
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

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <TextField
          name="courseId"
          label={t('sections.fields.courseId')}
          value={values.courseId}
          onChange={(value) => handleChange('courseId', value)}
          required
        />
        <TextField
          name="instructorId"
          label={t('sections.fields.instructorId')}
          value={values.instructorId}
          onChange={(value) => handleChange('instructorId', value)}
        />
        <SelectField
          name="weekday"
          label={t('sections.fields.weekday')}
          value={values.weekday}
          onChange={(value) => handleChange('weekday', value)}
          options={weekdayOptions}
          placeholder={t('sections.fields.weekdayPlaceholder')}
        />
        <TextField
          name="startTime"
          label={t('sections.fields.startTime')}
          value={values.startTime}
          onChange={(value) => handleChange('startTime', value)}
          placeholder="09:00"
        />
        <TextField
          name="endTime"
          label={t('sections.fields.endTime')}
          value={values.endTime}
          onChange={(value) => handleChange('endTime', value)}
          placeholder="11:00"
        />
        <DateField
          name="startDate"
          label={t('sections.fields.startDate')}
          value={values.startDate}
          onChange={(value) => handleChange('startDate', value)}
        />
        <DateField
          name="endDate"
          label={t('sections.fields.endDate')}
          value={values.endDate}
          onChange={(value) => handleChange('endDate', value)}
        />
        <TextField
          name="meetingLink"
          label={t('sections.fields.meetingLink')}
          value={values.meetingLink}
          onChange={(value) => handleChange('meetingLink', value)}
        />
      </div>
      {error ? <div className="error-state">{error}</div> : null}
      <button type="submit" className="button" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
        {submitting ? t('actions.saving') : t('actions.createSection')}
      </button>
    </form>
  );
}
