import {Toolbar} from '@/components/admin/toolbar';
import {detectRequestLocale, getTranslator} from '@/lib/i18n';

import {SectionForm} from './section-form';

export default async function NewSectionPage() {
  const locale = detectRequestLocale();
  const t = getTranslator(locale) as any;

  return (
    <div>
      <Toolbar title={t('admin.sections.new.title')} description={t('admin.sections.new.description')} />
      <SectionForm />
    </div>
  );
}
