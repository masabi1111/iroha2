import Link from 'next/link';

import {Table, type TableColumn} from '@/components/admin/table';
import {Toolbar} from '@/components/admin/toolbar';
import {detectRequestLocale, getTranslator} from '@/lib/i18n';
import {internalFetch} from '@/lib/server/internal';

import {ExportCsvButton, type CsvColumn} from './export-csv-button';

type SeasonOption = {
  id: string;
  code: string;
  title: string;
};

type EnrollmentRow = {
  courseCode: string;
  title: string;
  capacity: number | null;
  active: number | null;
  pending: number | null;
  waitlisted: number | null;
  completed: number | null;
  cancelled: number | null;
  seatsLeft: number | null;
};

async function fetchSeasonOptions(): Promise<SeasonOption[]> {
  const response = await internalFetch('/api/admin/seasons', { method: 'GET' });
  if (!response.ok) {
    return [];
  }

  try {
    const payload = (await response.json()) as SeasonOption[] | { items?: SeasonOption[]; data?: SeasonOption[] };
    const seasons = Array.isArray(payload)
      ? payload
      : payload.items ?? payload.data ?? [];
    return seasons.map((season) => ({
      id: season.id ?? season.code,
      code: season.code,
      title: season.title
    }));
  } catch (error) {
    return [];
  }
}

function toRow(item: any): EnrollmentRow | null {
  const courseCode = item?.courseCode ?? item?.course_code ?? item?.code;
  const title = item?.title ?? item?.courseTitle ?? item?.course_title;
  if (!courseCode) {
    return null;
  }

  const number = (value: any) => {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return {
    courseCode: String(courseCode),
    title: title ?? '',
    capacity: number(item?.capacity ?? item?.max_capacity ?? item?.limit),
    active: number(item?.active),
    pending: number(item?.pending),
    waitlisted: number(item?.waitlisted),
    completed: number(item?.completed),
    cancelled: number(item?.cancelled),
    seatsLeft: number(item?.seatsLeft ?? item?.seats_left)
  };
}

async function fetchReport(seasonCode: string): Promise<{ rows: EnrollmentRow[]; error?: string }> {
  if (!seasonCode) {
    return { rows: [] };
  }

  const response = await internalFetch(`/api/admin/reports/enrollment?season=${encodeURIComponent(seasonCode)}`, {
    method: 'GET'
  });

  if (!response.ok) {
    return { rows: [], error: `HTTP ${response.status}` };
  }

  try {
    const payload = (await response.json()) as EnrollmentRow[] | { data?: any[]; items?: any[] };
    const items = Array.isArray(payload) ? payload : payload.data ?? payload.items ?? [];
    const rows = items
      .map((item) => toRow(item))
      .filter((row): row is EnrollmentRow => Boolean(row));
    return { rows };
  } catch (error) {
    return { rows: [], error: 'invalid-json' };
  }
}

type ReportsPageProps = {
  searchParams?: Record<string, string | string[]>;
};

export default async function EnrollmentReportsPage({ searchParams }: ReportsPageProps) {
  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;
  const seasons = await fetchSeasonOptions();
  const selectedSeason = Array.isArray(searchParams?.season)
    ? searchParams?.season[0]
    : searchParams?.season ?? '';
  const { rows, error } = await fetchReport(selectedSeason ?? '');

  const columns: TableColumn<EnrollmentRow>[] = [
    {
      key: 'courseCode',
      header: t('admin.reports.enrollment.columns.code'),
      render: (row) => row.courseCode
    },
    {
      key: 'title',
      header: t('admin.reports.enrollment.columns.title'),
      render: (row) => row.title
    },
    {
      key: 'capacity',
      header: t('admin.reports.enrollment.columns.capacity'),
      render: (row) => row.capacity ?? '—',
      align: 'right'
    },
    {
      key: 'active',
      header: t('admin.reports.enrollment.columns.active'),
      render: (row) => row.active ?? 0,
      align: 'right'
    },
    {
      key: 'pending',
      header: t('admin.reports.enrollment.columns.pending'),
      render: (row) => row.pending ?? 0,
      align: 'right'
    },
    {
      key: 'waitlisted',
      header: t('admin.reports.enrollment.columns.waitlisted'),
      render: (row) => row.waitlisted ?? 0,
      align: 'right'
    },
    {
      key: 'completed',
      header: t('admin.reports.enrollment.columns.completed'),
      render: (row) => row.completed ?? 0,
      align: 'right'
    },
    {
      key: 'cancelled',
      header: t('admin.reports.enrollment.columns.cancelled'),
      render: (row) => row.cancelled ?? 0,
      align: 'right'
    },
    {
      key: 'seatsLeft',
      header: t('admin.reports.enrollment.columns.seatsLeft'),
      render: (row) => row.seatsLeft ?? '—',
      align: 'right'
    }
  ];

  const csvColumns: CsvColumn<EnrollmentRow>[] = columns.map((column) => ({
    key: column.key as keyof EnrollmentRow,
    header: String(column.header)
  }));

  return (
    <div>
      <Toolbar
        title={t('admin.reports.enrollment.title')}
        description={t('admin.reports.enrollment.description')}
        actions={
          rows.length ? (
            <ExportCsvButton
              rows={rows}
              columns={csvColumns}
              filename={`enrollment-${selectedSeason || 'all'}.csv`}
            />
          ) : undefined
        }
      >
        <form method="get" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '200px' }}>
            <span>{t('admin.reports.enrollment.filter')}</span>
            <select
              name="season"
              defaultValue={selectedSeason ?? ''}
              style={{
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                padding: '0.6rem 0.75rem',
                background: '#ffffff'
              }}
            >
              <option value="">{t('admin.reports.enrollment.allSeasons')}</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.code}>
                  {season.code}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="button">
            {t('admin.actions.filter')}
          </button>
        </form>
      </Toolbar>
      {error ? <div className="error-state">{t('admin.messages.error')}</div> : null}
      <Table
        columns={columns}
        data={rows}
        emptyMessage={selectedSeason ? t('admin.reports.enrollment.empty') : t('admin.reports.enrollment.prompt')}
      />
      {!rows.length && !selectedSeason ? (
        <div style={{ marginTop: '1rem', color: '#6b7280' }}>
          <Link href="/admin/seasons" className="nav-link">
            {t('admin.reports.enrollment.manageSeasons')}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
