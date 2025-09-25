'use client';

import Link from 'next/link';
import {FormEvent, useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';

import type {Section} from '@/lib/api';
import type {EnrollResponse} from '@/types/api';

type ToastState = {
  variant: 'success' | 'error';
  message: string;
};

interface EnrollFormProps {
  courseId: string;
  sections: Section[];
  labels: {
    submit: string;
    loading: string;
    sectionLabel: string;
    sectionPlaceholder: string;
    noSections: string;
    optional: string;
    waitlistedTitle: string;
    waitlistedDescription: string;
    waitlistedSeats: string;
    dashboardCta: string;
    successToast: string;
    errorToast: string;
  };
}

export function EnrollForm({courseId, sections, labels}: EnrollFormProps) {
  const router = useRouter();
  const [sectionId, setSectionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [waitlisted, setWaitlisted] = useState<EnrollResponse | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setToast(null);
    setWaitlisted(null);

    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId,
          ...(sectionId ? { sectionId } : {})
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Enrollment failed');
      }

      const data = (await response.json()) as EnrollResponse;
      setToast({ variant: 'success', message: labels.successToast });

      if (data.status === 'waitlisted') {
        setWaitlisted(data);
        return;
      }

      if (data.status === 'pending') {
        router.push(`/checkout/${data.enrollmentId}`);
        return;
      }

      router.push('/dashboard');
    } catch (error) {
      setToast({ variant: 'error', message: labels.errorToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const waitlistSeats = waitlisted ? waitlisted.seats_left ?? waitlisted.seatsLeft ?? null : null;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {toast ? (
        <div className={`toast toast--${toast.variant}`}>{toast.message}</div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="section">
          {labels.sectionLabel}
          {sections.length ? <span style={{ color: '#6b7280' }}> · {labels.optional}</span> : null}
        </label>
        {sections.length ? (
          <select
            id="section"
            name="section"
            value={sectionId}
            onChange={(event) => setSectionId(event.target.value)}
            style={{
              padding: '0.75rem',
              borderRadius: '0.75rem',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              fontSize: '1rem'
            }}
          >
            <option value="">{labels.sectionPlaceholder}</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title ?? section.id}
              </option>
            ))}
          </select>
        ) : (
          <p style={{ margin: 0, color: '#6b7280' }}>{labels.noSections}</p>
        )}
      </div>

      <button
        type="submit"
        className="button"
        disabled={isSubmitting}
        style={{
          alignSelf: 'flex-start',
          opacity: isSubmitting ? 0.7 : 1,
          cursor: isSubmitting ? 'not-allowed' : 'pointer'
        }}
      >
        {isSubmitting ? labels.loading : labels.submit}
      </button>

      {waitlisted ? (
        <div
          style={{
            borderRadius: '0.75rem',
            border: '1px solid #f59e0b',
            background: '#fef3c7',
            padding: '1.25rem'
          }}
        >
          <h2 style={{ marginTop: 0 }}>{labels.waitlistedTitle}</h2>
          <p style={{ marginBottom: '0.5rem' }}>{labels.waitlistedDescription}</p>
          {waitlistSeats != null ? (
            <p style={{ marginTop: 0 }}>{labels.waitlistedSeats.replace('{count}', String(waitlistSeats))}</p>
          ) : null}
          <Link
            className="button"
            href="/dashboard"
            style={{
              marginTop: '1rem',
              backgroundColor: '#f59e0b',
              color: '#1f2937'
            }}
          >
            {labels.dashboardCta}
          </Link>
        </div>
      ) : null}
    </form>
  );
}
