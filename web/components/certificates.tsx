import Link from 'next/link';

export type CertificateSummary = {
  id: string;
  title?: string | null;
  courseTitle?: string | null;
  url?: string | null;
};

type CertificatesProps = {
  heading: string;
  certificates: CertificateSummary[];
  emptyMessage: string;
  actionLabel: string;
};

export function Certificates({ heading, certificates, emptyMessage, actionLabel }: CertificatesProps) {
  return (
    <article className="card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
      <header>
        <h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
      </header>

      {certificates.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {certificates.map((certificate) => (
            <li key={certificate.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-800">{certificate.title ?? 'Certificate'}</span>
                {certificate.courseTitle ? (
                  <span className="text-xs text-slate-500">{certificate.courseTitle}</span>
                ) : null}
              </div>
              {certificate.url ? (
                <Link
                  href={certificate.url}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-600 px-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-emerald-500"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {actionLabel}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default Certificates;
