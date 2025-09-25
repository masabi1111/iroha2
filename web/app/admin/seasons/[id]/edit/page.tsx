import {notFound} from 'next/navigation';

import {Toolbar} from '@/components/admin/toolbar';
import {detectRequestLocale, getTranslator} from '@/lib/i18n';
import {internalFetch} from '@/lib/server/internal';

import {SeasonForm} from '../../season-form';

type SeasonResponse = {
  id: string;
  code: string;
  title: string;
  enrollmentOpen?: string | null;
  enrollmentClose?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
};

async function fetchSeason(id: string): Promise<SeasonResponse | null> {
  const response = await internalFetch(`/api/admin/seasons/${encodeURIComponent(id)}`, { method: 'GET' });
  if (!response.ok) {
    return null;
  }

  try {
    return (await response.json()) as SeasonResponse;
  } catch (error) {
    return null;
  }
}

type EditSeasonPageProps = {
  params: { id: string };
};

export default async function EditSeasonPage({ params }: EditSeasonPageProps) {
  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;
  const season = await fetchSeason(params.id);

  if (!season) {
    notFound();
  }

  return (
    <div>
      <Toolbar
        title={t('admin.seasons.edit.title', { code: season.code })}
        description={t('admin.seasons.edit.description')}
      />
      <SeasonForm
        seasonId={season.id}
        submitLabel={t('admin.actions.save')}
        initialValues={{
          code: season.code,
          title: season.title,
          enrollmentOpen: season.enrollmentOpen ?? '',
          enrollmentClose: season.enrollmentClose ?? '',
          startDate: season.startDate ?? '',
          endDate: season.endDate ?? '',
          status: season.status ?? 'draft'
        }}
      />
    </div>
  );
}
