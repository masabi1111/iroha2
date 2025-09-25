import Link from 'next/link';

export type QuizSummary = {
  id: string;
  title?: string | null;
  dueAt?: Date | null;
  courseTitle?: string | null;
  startUrl?: string | null;
};

type QuizListProps = {
  heading: string;
  quizzes: QuizSummary[];
  locale: string;
  emptyMessage: string;
  actionLabel: string;
};

function formatDate(value: QuizSummary['dueAt'], locale: string): string | null {
  if (!value) return null;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

export function QuizList({ heading, quizzes, locale, emptyMessage, actionLabel }: QuizListProps) {
  return (
    <article className="card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
      <header>
        <h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
      </header>

      {quizzes.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {quizzes.map((quiz) => {
            const dueLabel = formatDate(quiz.dueAt ?? null, locale);

            return (
              <li key={quiz.id} className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-slate-800">{quiz.title ?? 'Quiz'}</span>
                  {quiz.courseTitle ? (
                    <span className="text-xs text-slate-500">{quiz.courseTitle}</span>
                  ) : null}
                  {dueLabel ? <span className="text-xs text-blue-600">{dueLabel}</span> : null}
                </div>
                {quiz.startUrl ? (
                  <div>
                    <Link
                      href={quiz.startUrl}
                      className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-blue-500"
                      prefetch={false}
                    >
                      {actionLabel}
                    </Link>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

export default QuizList;
