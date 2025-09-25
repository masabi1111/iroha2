import {Toolbar} from '@/components/admin/toolbar';
import {detectRequestLocale, getTranslator} from '@/lib/i18n';
import {internalFetch} from '@/lib/server/internal';

import {CourseForm} from '../course-form';

type SeasonOption = {
  id: string;
  code: string;
  title: string;
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

export default async function NewCoursePage() {
  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;
  const seasons = await fetchSeasonOptions();

  return (
    <div>
      <Toolbar title={t('admin.courses.new.title')} description={t('admin.courses.new.description')} />
      <CourseForm seasons={seasons} submitLabel={t('admin.actions.create')} />
    </div>
  );
}
