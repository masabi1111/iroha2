import Link from 'next/link';

import {Table, type TableColumn} from '@/components/admin/table';
import {Toolbar} from '@/components/admin/toolbar';
import {detectRequestLocale, getTranslator} from '@/lib/i18n';
import {internalFetch} from '@/lib/server/internal';

import {PublishedToggle} from './published-toggle';

type SeasonOption = {
  id: string;
  code: string;
  title: string;
};

type CourseListItem = {
  id: string;
  code: string;
  title: string;
  level?: string | null;
  priceCents?: number | null;
  currency?: string | null;
  published?: boolean;
  seasonCode?: string | null;
};

type ListResponse<T> = {
  data?: T[];
  items?: T[];
  meta?: {
    page?: number;
    pageCount?: number;
  };
};

async function fetchSeasons(): Promise<SeasonOption[]> {
  const response = await internalFetch('/api/admin/seasons', { method: 'GET' });
  if (!response.ok) {
    return [];
  }

  try {
    const payload = (await response.json()) as ListResponse<SeasonOption> | SeasonOption[];
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

function toCourse(item: any): CourseListItem | null {
  const id = item?.id ?? item?.courseId;
  const code = item?.code;
  const title = item?.title;
  if (!id || !code || !title) {
    return null;
  }

  return {
    id: String(id),
    code,
    title,
    level: item.level ?? item.courseLevel ?? null,
    priceCents: item.priceCents ?? item.price_cents ?? null,
    currency: item.currency ?? item.priceCurrency ?? null,
    published: Boolean(
      item.published ?? item.isPublished ?? item.status === 'published' ?? item.state === 'published'
    ),
    seasonCode: item.season?.code ?? item.seasonCode ?? null
  };
}

async function fetchCourses(params: URLSearchParams): Promise<{ courses: CourseListItem[]; meta: { page: number; pageCount: number }; error?: string }> {
  const query = params.toString();
  const response = await internalFetch(`/api/admin/courses${query ? `?${query}` : ''}`, { method: 'GET' });

  if (!response.ok) {
    return { courses: [], meta: { page: 1, pageCount: 1 }, error: `HTTP ${response.status}` };
  }

  try {
    const payload = (await response.json()) as ListResponse<any> | any[];
    const items = Array.isArray(payload) ? payload : payload.items ?? payload.data ?? [];
    const courses = items
      .map((item) => toCourse(item))
      .filter((course): course is CourseListItem => Boolean(course));
    const meta = Array.isArray(payload)
      ? { page: 1, pageCount: 1 }
      : { page: payload.meta?.page ?? 1, pageCount: payload.meta?.pageCount ?? 1 };

    return { courses, meta };
  } catch (error) {
    return { courses: [], meta: { page: 1, pageCount: 1 }, error: 'invalid-json' };
  }
}

function formatPrice(course: CourseListItem, locale: string): string {
  if (!course.priceCents) {
    return '—';
  }

  const currency = course.currency ?? 'USD';
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  });

  return formatter.format(course.priceCents / 100);
}

type CoursesPageProps = {
  searchParams?: Record<string, string | string[]>;
};

export default async function AdminCoursesPage({ searchParams }: CoursesPageProps) {
  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;

  const params = new URLSearchParams();
  const selectedSeason = Array.isArray(searchParams?.season)
    ? searchParams?.season[0]
    : searchParams?.season ?? '';

  if (selectedSeason) {
    params.set('season', selectedSeason);
  }

  if (searchParams?.page) {
    const page = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
    if (page) {
      params.set('page', page);
    }
  }

  const [seasons, { courses, meta, error }] = await Promise.all([
    fetchSeasons(),
    fetchCourses(params)
  ]);

  const columns: TableColumn<CourseListItem>[] = [
    {
      key: 'code',
      header: t('admin.courses.list.code'),
      render: (course) => course.code
    },
    {
      key: 'title',
      header: t('admin.courses.list.title'),
      render: (course) => course.title
    },
    {
      key: 'level',
      header: t('admin.courses.list.level'),
      render: (course) => course.level ?? '—'
    },
    {
      key: 'season',
      header: t('admin.courses.list.season'),
      render: (course) => course.seasonCode ?? '—'
    },
    {
      key: 'price',
      header: t('admin.courses.list.price'),
      render: (course) => formatPrice(course, locale),
      align: 'right'
    },
    {
      key: 'published',
      header: t('admin.courses.list.published'),
      render: (course) => (
        <PublishedToggle courseId={course.id} initialPublished={Boolean(course.published)} />
      )
    },
    {
      key: 'actions',
      header: t('admin.actions.manage'),
      render: (course) => (
        <div className="actions">
          <Link className="button" href={`/admin/courses/${course.id}/edit`} prefetch={false}>
            {t('admin.actions.edit')}
          </Link>
        </div>
      )
    }
  ];

  return (
    <div>
      <Toolbar
        title={t('admin.courses.title')}
        description={t('admin.courses.description')}
        actions={
          <Link className="button" href="/admin/courses/new" prefetch={false}>
            {t('admin.actions.new')}
          </Link>
        }
      >
        <form method="get" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '200px' }}>
            <span>{t('admin.courses.filter.season')}</span>
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
              <option value="">{t('admin.courses.filter.allSeasons')}</option>
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
        data={courses}
        emptyMessage={t('admin.messages.noCourses')}
        pagination={{
          page: meta.page,
          pageCount: meta.pageCount,
          prevHref: meta.page > 1 ? `/admin/courses?season=${selectedSeason}&page=${meta.page - 1}` : undefined,
          nextHref:
            meta.page < meta.pageCount
              ? `/admin/courses?season=${selectedSeason}&page=${meta.page + 1}`
              : undefined,
          summary: t('admin.pagination.summary', { page: meta.page, pages: meta.pageCount })
        }}
        getRowKey={(course) => course.id}
      />
    </div>
  );
}
