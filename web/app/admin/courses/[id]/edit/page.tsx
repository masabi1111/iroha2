import {notFound} from 'next/navigation';

import {Toolbar} from '@/components/admin/toolbar';
import {detectRequestLocale, getTranslator} from '@/lib/i18n';
import {internalFetch} from '@/lib/server/internal';

import {CourseForm} from '../../course-form';

type SeasonOption = {
  id: string;
  code: string;
  title: string;
};

type CourseResponse = {
  id: string;
  code: string;
  title: string;
  level?: string | null;
  modality?: string | null;
  capacity?: number | null;
  priceCents?: number | null;
  currency?: string | null;
  published?: boolean;
  seasonId?: string | null;
  season?: { id?: string; code?: string } | null;
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

async function fetchCourse(id: string): Promise<CourseResponse | null> {
  const response = await internalFetch(`/api/admin/courses/${encodeURIComponent(id)}`, { method: 'GET' });
  if (!response.ok) {
    return null;
  }

  try {
    return (await response.json()) as CourseResponse;
  } catch (error) {
    return null;
  }
}

type EditCoursePageProps = {
  params: { id: string };
};

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;

  const [seasons, course] = await Promise.all([fetchSeasonOptions(), fetchCourse(params.id)]);

  if (!course) {
    notFound();
  }

  const seasonId = course.seasonId ?? course.season?.id ?? '';

  return (
    <div>
      <Toolbar
        title={t('admin.courses.edit.title', { code: course.code })}
        description={t('admin.courses.edit.description')}
      />
      <CourseForm
        courseId={course.id}
        seasons={seasons}
        submitLabel={t('admin.actions.save')}
        publishEndpoint={`/api/admin/courses/${course.id}/publish`}
        initialValues={{
          seasonId: String(seasonId ?? ''),
          code: course.code,
          title: course.title,
          level: course.level ?? 'A0',
          modality: course.modality ?? '',
          capacity: course.capacity ? String(course.capacity) : '',
          priceCents: course.priceCents ? String(course.priceCents) : '',
          currency: course.currency ?? 'USD',
          published: Boolean(course.published)
        }}
      />
    </div>
  );
}
