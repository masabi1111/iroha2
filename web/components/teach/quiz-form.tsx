'use client';

import {FormEvent, useEffect, useMemo, useState} from 'react';

interface QuizFormProps {
  sectionId: string;
  disabled?: boolean;
  disabledReason?: string;
  initialQuiz?: {
    id?: string;
    title?: string | null;
    totalPoints?: number | null;
    availableFrom?: string | null;
    dueAt?: string | null;
  } | null;
}

type QuizMode = 'create' | 'update';

type ToastState = {
  variant: 'success' | 'error';
  message: string;
};

function toInputDateTime(value?: string | null): string {
  if (!value) {
    return '';
  }

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

function toIso(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    return date.toISOString();
  } catch {
    return undefined;
  }
}

export function QuizForm({ sectionId, disabled = false, disabledReason, initialQuiz = null }: QuizFormProps) {
  const [mode, setMode] = useState<QuizMode>(initialQuiz?.id ? 'update' : 'create');
  const [quizId, setQuizId] = useState(initialQuiz?.id ?? '');
  const [title, setTitle] = useState(initialQuiz?.title ?? '');
  const [totalPoints, setTotalPoints] = useState(
    initialQuiz?.totalPoints != null ? String(initialQuiz.totalPoints) : ''
  );
  const [availableFrom, setAvailableFrom] = useState(toInputDateTime(initialQuiz?.availableFrom ?? null));
  const [dueAt, setDueAt] = useState(toInputDateTime(initialQuiz?.dueAt ?? null));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!initialQuiz) {
      return;
    }

    setQuizId(initialQuiz.id ?? '');
    setTitle(initialQuiz.title ?? '');
    setTotalPoints(initialQuiz.totalPoints != null ? String(initialQuiz.totalPoints) : '');
    setAvailableFrom(toInputDateTime(initialQuiz.availableFrom ?? null));
    setDueAt(toInputDateTime(initialQuiz.dueAt ?? null));
    setMode(initialQuiz.id ? 'update' : 'create');
  }, [initialQuiz]);

  const actionLabel = useMemo(() => (mode === 'create' ? 'Create quiz' : 'Update quiz'), [mode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (disabled || isSubmitting) {
      return;
    }

    if (!title.trim()) {
      setToast({ variant: 'error', message: 'Title is required.' });
      return;
    }

    if (mode === 'update' && !quizId.trim()) {
      setToast({ variant: 'error', message: 'Quiz ID is required to update.' });
      return;
    }

    const points = totalPoints.trim() ? Number(totalPoints) : null;

    if (points != null && (!Number.isFinite(points) || points < 0)) {
      setToast({ variant: 'error', message: 'Total points must be a positive number.' });
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    const body: Record<string, unknown> = {
      sectionId,
      title: title.trim()
    };

    if (points != null) {
      body.totalPoints = points;
    }

    const availableIso = toIso(availableFrom);
    if (availableIso) {
      body.availableFrom = availableIso;
    }

    const dueIso = toIso(dueAt);
    if (dueIso) {
      body.dueAt = dueIso;
    }

    const url = mode === 'create' ? '/api/teach/quizzes' : `/api/teach/quizzes/${encodeURIComponent(quizId.trim())}`;
    const method = mode === 'create' ? 'POST' : 'PATCH';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        cache: 'no-store'
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorBody = await response.json().catch(() => ({}));
          const message = typeof errorBody?.message === 'string' ? errorBody.message : 'Unable to save quiz.';
          throw new Error(message);
        }

        throw new Error('Unable to save quiz.');
      }

      setToast({ variant: 'success', message: mode === 'create' ? 'Quiz created.' : 'Quiz updated.' });

      if (mode === 'create') {
        setTitle('');
        setTotalPoints('');
        setAvailableFrom('');
        setDueAt('');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save quiz.';
      setToast({ variant: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {toast ? <div className={`toast toast--${toast.variant}`}>{toast.message}</div> : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <label htmlFor="quiz-mode" style={{ fontWeight: 600 }}>
          Action
        </label>
        <select
          id="quiz-mode"
          value={mode}
          onChange={(event) => setMode(event.target.value as QuizMode)}
          disabled={disabled || isSubmitting}
          style={{
            borderRadius: '0.5rem',
            border: '1px solid #d1d5db',
            padding: '0.5rem 0.75rem'
          }}
        >
          <option value="create">Create new quiz</option>
          <option value="update">Update existing quiz</option>
        </select>
      </div>

      {mode === 'update' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="quiz-id" style={{ fontWeight: 600 }}>
            Quiz ID
          </label>
          <input
            id="quiz-id"
            type="text"
            value={quizId}
            onChange={(event) => setQuizId(event.target.value)}
            disabled={disabled || isSubmitting}
            required={mode === 'update'}
            placeholder="Enter existing quiz id"
            style={{
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              padding: '0.5rem 0.75rem'
            }}
          />
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="quiz-title" style={{ fontWeight: 600 }}>
          Title
        </label>
        <input
          id="quiz-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={disabled || isSubmitting}
          placeholder="Quiz title"
          style={{
            borderRadius: '0.5rem',
            border: '1px solid #d1d5db',
            padding: '0.5rem 0.75rem'
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="quiz-points" style={{ fontWeight: 600 }}>
          Total points
        </label>
        <input
          id="quiz-points"
          type="number"
          min={0}
          value={totalPoints}
          onChange={(event) => setTotalPoints(event.target.value)}
          disabled={disabled || isSubmitting}
          placeholder="e.g. 100"
          style={{
            borderRadius: '0.5rem',
            border: '1px solid #d1d5db',
            padding: '0.5rem 0.75rem'
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="quiz-available" style={{ fontWeight: 600 }}>
          Available from
        </label>
        <input
          id="quiz-available"
          type="datetime-local"
          value={availableFrom}
          onChange={(event) => setAvailableFrom(event.target.value)}
          disabled={disabled || isSubmitting}
          style={{
            borderRadius: '0.5rem',
            border: '1px solid #d1d5db',
            padding: '0.5rem 0.75rem'
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="quiz-due" style={{ fontWeight: 600 }}>
          Due at
        </label>
        <input
          id="quiz-due"
          type="datetime-local"
          value={dueAt}
          onChange={(event) => setDueAt(event.target.value)}
          disabled={disabled || isSubmitting}
          style={{
            borderRadius: '0.5rem',
            border: '1px solid #d1d5db',
            padding: '0.5rem 0.75rem'
          }}
        />
      </div>

      {disabledReason ? (
        <div className="error-state" style={{ textAlign: 'left' }}>
          {disabledReason}
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          className="button"
          disabled={disabled || isSubmitting}
          style={{ opacity: disabled || isSubmitting ? 0.7 : 1 }}
        >
          {isSubmitting ? 'Saving…' : actionLabel}
        </button>
      </div>
    </form>
  );
}
