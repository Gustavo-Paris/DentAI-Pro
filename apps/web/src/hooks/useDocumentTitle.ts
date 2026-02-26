import { useEffect } from 'react';
import i18n from '@/lib/i18n';

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const prev = document.title;
    document.title = title
      ? `${title} | ToSmile.ai`
      : i18n.t('meta.defaultTitle');
    return () => {
      document.title = prev;
    };
  }, [title]);
}
