'use client';

import {useEffect} from 'react';
import {useTranslations} from 'next-intl';

export default function SeasonsError({error, reset}: {error: Error & { digest?: string }; reset: () => void}) {
  const t = useTranslations();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="error-state" role="alert">
      <p>{t('errors.generic')}</p>
      <button className="button" onClick={() => reset()} style={{ marginTop: '1rem' }}>
        {t('actions.retry')}
      </button>
    </div>
  );
}
