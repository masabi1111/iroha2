import Link from 'next/link';

export type LessonSummary = {
  courseTitle?: string | null;
  lessonTitle?: string | null;
  releaseAt?: Date | string | null;
  videoUrl?: string | null;
};

type LessonCardProps = {
  heading: string;
  lesson?: LessonSummary | null;
  locale: string;
  actionLabel: string;
  emptyMessage: string;
};

function formatDateTime(value: LessonSummary['releaseAt'], locale: string): string | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export function LessonCard({ heading, lesson, locale, actionLabel, emptyMessage }: LessonCardProps) {
  const formattedRelease = formatDateTime(lesson?.releaseAt ?? null, locale);
  const hasLesson = Boolean(lesson?.lessonTitle || formattedRelease || lesson?.videoUrl);

  return (
    <article className="card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
        {lesson?.courseTitle ? (
          <span className="text-sm text-slate-500">{lesson.courseTitle}</span>
        ) : null}
      </header>

      {hasLesson ? (
        <div className="space-y-2">
          {lesson?.lessonTitle ? (
            <p className="text-base font-medium text-slate-800">{lesson.lessonTitle}</p>
          ) : null}
          {formattedRelease ? (
            <p className="text-sm text-slate-500">{formattedRelease}</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      )}

      {lesson?.videoUrl ? (
        <footer className="mt-auto">
          <Link
            href={lesson.videoUrl}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            {actionLabel}
          </Link>
        </footer>
      ) : null}
    </article>
  );
}

export default LessonCard;
