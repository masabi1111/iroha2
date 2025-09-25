'use client';

import {FormEvent, useEffect, useMemo, useState} from 'react';

interface LessonFormProps {
  sectionId: string;
  disabled?: boolean;
  disabledReason?: string;
  initialLesson?: {
    id?: string;
    title?: string | null;
    videoUrl?: string | null;
    releaseAt?: string | null;
  } | null;
}

type LessonMode = 'create' | 'update';

type ToastState = {
  variant: 'success' | 'error';
  message: string;
};

function toInputDate(value?: string | null): string {
  if (!value) {
    return '';
  }

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const iso = date.toISOString();
    return iso.slice(0, 16);
  } catch {
    return '';
  }
}

function toIsoString(value: string): string | undefined {
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

export function LessonForm({ sectionId, disabled = false, disabledReason, initialLesson = null }: LessonFormProps) {
  const [mode, setMode] = useState<LessonMode>(initialLesson?.id ? 'update' : 'create');
  const [lessonId, setLessonId] = useState(initialLesson?.id ?? '');
  const [title, setTitle] = useState(initialLesson?.title ?? '');
  const [videoUrl, setVideoUrl] = useState(initialLesson?.videoUrl ?? '');
  const [releaseAt, setReleaseAt] = useState(toInputDate(initialLesson?.releaseAt ?? null));
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
    if (!initialLesson) {
      return;
    }

    setLessonId(initialLesson.id ?? '');
    setTitle(initialLesson.title ?? '');
    setVideoUrl(initialLesson.videoUrl ?? '');
    setReleaseAt(toInputDate(initialLesson.releaseAt ?? null));
    setMode(initialLesson.id ? 'update' : 'create');
  }, [initialLesson]);

  const actionLabel = useMemo(() => (mode === 'create' ? 'Create lesson' : 'Update lesson'), [mode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (disabled || isSubmitting) {
      return;
    }

    if (!title.trim()) {
      setToast({ variant: 'error', message: 'Title is required.' });
      return;
    }

    if (mode === 'update' && !lessonId.trim()) {
      setToast({ variant: 'error', message: 'Lesson ID is required to update.' });
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    const body: Record<string, unknown> = {
      sectionId,
      title: title.trim()
    };

    if (videoUrl.trim()) {
      body.videoUrl = videoUrl.trim();
    }

    const releaseIso = toIsoString(releaseAt);
    if (releaseIso) {
      body.releaseAt = releaseIso;
    }

    const url = mode === 'create' ? '/api/teach/lessons' : `/api/teach/lessons/${encodeURIComponent(lessonId.trim())}`;
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
          const message = typeof errorBody?.message === 'string' ? errorBody.message : 'Unable to save lesson.';
          throw new Error(message);
        }

        throw new Error('Unable to save lesson.');
      }

      setToast({ variant: 'success', message: mode === 'create' ? 'Lesson created.' : 'Lesson updated.' });

      if (mode === 'create') {
        setTitle('');
        setVideoUrl('');
        setReleaseAt('');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save lesson.';
      setToast({ variant: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {toast ? <div className={`toast toast--${toast.variant}`}>{toast.message}</div> : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <label htmlFor="lesson-mode" style={{ fontWeight: 600 }}>
          Action
        </label>
        <select
          id="lesson-mode"
          value={mode}
          onChange={(event) => setMode(event.target.value as LessonMode)}
          disabled={disabled || isSubmitting}
          style={{
            borderRadius: '0.5rem',
            border: '1px solid #d1d5db',
            padding: '0.5rem 0.75rem'
          }}
        >
          <option value="create">Create new lesson</option>
          <option value="update">Update existing lesson</option>
        </select>
      </div>

      {mode === 'update' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="lesson-id" style={{ fontWeight: 600 }}>
            Lesson ID
          </label>
          <input
            id="lesson-id"
            type="text"
            value={lessonId}
            onChange={(event) => setLessonId(event.target.value)}
            disabled={disabled || isSubmitting}
            required={mode === 'update'}
            placeholder="Enter existing lesson id"
            style={{
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              padding: '0.5rem 0.75rem'
            }}
          />
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="lesson-title" style={{ fontWeight: 600 }}>
          Title
        </label>
        <input
          id="lesson-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={disabled || isSubmitting}
          placeholder="Lesson title"
          style={{
            borderRadius: '0.5rem',
            border: '1px solid #d1d5db',
            padding: '0.5rem 0.75rem'
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="lesson-video" style={{ fontWeight: 600 }}>
          Video URL
        </label>
        <input
          id="lesson-video"
          type="url"
          value={videoUrl}
          onChange={(event) => setVideoUrl(event.target.value)}
          disabled={disabled || isSubmitting}
          placeholder="https://example.com/lesson"
          style={{
            borderRadius: '0.5rem',
            border: '1px solid #d1d5db',
            padding: '0.5rem 0.75rem'
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="lesson-release" style={{ fontWeight: 600 }}>
          Release at
        </label>
        <input
          id="lesson-release"
          type="datetime-local"
          value={releaseAt}
          onChange={(event) => setReleaseAt(event.target.value)}
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
