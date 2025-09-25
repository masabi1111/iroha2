export type AttendanceSnapshot = {
  percentage: number | null;
  presentCount?: number | null;
  totalCount?: number | null;
  status?: string | null;
};

type AttendanceSummaryProps = {
  heading: string;
  snapshot?: AttendanceSnapshot | null;
  emptyMessage: string;
};

function formatPercentage(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  const bounded = Math.max(0, Math.min(100, value));
  return `${Math.round(bounded)}%`;
}

export function AttendanceSummary({ heading, snapshot, emptyMessage }: AttendanceSummaryProps) {
  const percentLabel = formatPercentage(snapshot?.percentage ?? null);
  const hasData = typeof snapshot?.presentCount === 'number' && typeof snapshot?.totalCount === 'number' && snapshot.totalCount > 0;

  return (
    <article className="card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
      <header>
        <h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
      </header>

      {percentLabel ? (
        <div className="flex flex-col gap-2">
          <span className="text-3xl font-bold text-blue-600">{percentLabel}</span>
          {snapshot?.status ? <span className="text-sm text-slate-500">{snapshot.status}</span> : null}
        </div>
      ) : (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      )}

      {hasData ? (
        <p className="text-xs text-slate-500">{snapshot?.presentCount} / {snapshot?.totalCount}</p>
      ) : null}
    </article>
  );
}

export default AttendanceSummary;
