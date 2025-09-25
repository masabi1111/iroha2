import {Toolbar} from '@/components/admin/toolbar';
import {detectRequestLocale, getTranslator} from '@/lib/i18n';

import {SeasonForm} from '../season-form';

export default async function NewSeasonPage() {
  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;

  return (
    <div>
      <Toolbar title={t('admin.seasons.new.title')} description={t('admin.seasons.new.description')} />
      <SeasonForm submitLabel={t('admin.actions.create')} />
    </div>
  );
}
