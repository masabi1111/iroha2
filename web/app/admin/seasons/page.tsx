import Link from 'next/link';

import {Table, type TableColumn} from '@/components/admin/table';
import {Toolbar} from '@/components/admin/toolbar';
import {detectRequestLocale, getTranslator} from '@/lib/i18n';
import {internalFetch} from '@/lib/server/internal';

type SeasonListItem = {
  id: string;
  code: string;
  title: string;
  status?: string | null;
  enrollmentOpen?: string | null;
  enrollmentClose?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

type SeasonListResponse = {
  data?: SeasonListItem[];
  items?: SeasonListItem[];
  seasons?: SeasonListItem[];
  meta?: {
    page?: number;
    pageCount?: number;
  };
};

async function fetchSeasons(search: string | undefined): Promise<{ seasons: SeasonListItem[]; meta: { page: number; pageCount: number }; error?: string }> {
  const query = search ? `?${search}` : '';
  const response = await internalFetch(`/api/admin/seasons${query ? query : ''}`, { method: 'GET' });

  if (!response.ok) {
    return {
      seasons: [],
      meta: { page: 1, pageCount: 1 },
      error: `HTTP ${response.status}`
    };
  }

  let payload: SeasonListResponse | SeasonListItem[] = [];

  try {
    payload = (await response.json()) as SeasonListResponse | SeasonListItem[];
  } catch (error) {
    return { seasons: [], meta: { page: 1, pageCount: 1 }, error: 'invalid-json' };
  }

  const seasons = Array.isArray(payload)
    ? payload
    : payload.seasons ?? payload.items ?? payload.data ?? [];
  const meta = Array.isArray(payload)
    ? { page: 1, pageCount: 1 }
    : {
        page: payload.meta?.page ?? 1,
        pageCount: payload.meta?.pageCount ?? 1
      };

  return { seasons, meta };
}

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
  } catch (error) {
    return value;
  }
}

type SeasonsPageProps = {
  searchParams?: Record<string, string | string[]>;
};

export default async function AdminSeasonsPage({ searchParams }: SeasonsPageProps) {
  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;
  const search = new URLSearchParams();

  if (searchParams?.page) {
    const page = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
    if (page) {
      search.set('page', page);
    }
  }

  const { seasons, meta, error } = await fetchSeasons(search.toString());

  const columns: TableColumn<SeasonListItem>[] = [
    {
      key: 'code',
      header: t('admin.seasons.list.code'),
      render: (season) => season.code
    },
    {
      key: 'title',
      header: t('admin.seasons.list.title'),
      render: (season) => season.title
    },
    {
      key: 'status',
      header: t('admin.seasons.list.status'),
      render: (season) => season.status ?? t('admin.seasons.status.draft')
    },
    {
      key: 'enrollment',
      header: t('admin.seasons.list.enrollment'),
      render: (season) =>
        t('admin.seasons.list.enrollmentWindow', {
          start: formatDate(season.enrollmentOpen, locale),
          end: formatDate(season.enrollmentClose, locale)
        })
    },
    {
      key: 'dates',
      header: t('admin.seasons.list.dates'),
      render: (season) =>
        t('admin.seasons.list.seasonWindow', {
          start: formatDate(season.startDate, locale),
          end: formatDate(season.endDate, locale)
        })
    },
    {
      key: 'actions',
      header: t('admin.actions.manage'),
      render: (season) => (
        <div className="actions">
          <Link className="button" href={`/admin/seasons/${season.id}/edit`} prefetch={false}>
            {t('admin.actions.edit')}
          </Link>
        </div>
      )
    }
  ];

  return (
    <div>
      <Toolbar
        title={t('admin.seasons.title')}
        description={t('admin.seasons.description')}
        actions={
          <Link className="button" href="/admin/seasons/new" prefetch={false}>
            {t('admin.actions.new')}
          </Link>
        }
      />
      {error ? <div className="error-state">{t('admin.messages.error')}</div> : null}
      <Table
        columns={columns}
        data={seasons}
        emptyMessage={t('admin.messages.noSeasons')}
        pagination={{
          page: meta.page,
          pageCount: meta.pageCount,
          prevHref: meta.page > 1 ? `/admin/seasons?page=${meta.page - 1}` : undefined,
          nextHref: meta.page < meta.pageCount ? `/admin/seasons?page=${meta.page + 1}` : undefined,
          summary: t('admin.pagination.summary', { page: meta.page, pages: meta.pageCount })
        }}
        getRowKey={(season) => season.id ?? season.code}
      />
    </div>
  );
}
