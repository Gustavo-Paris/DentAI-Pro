import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from '@/locales/pt-BR.json';

// Initialize with pt-BR eagerly (default language).
// en-US is lazy-loaded on demand (~25KB gzip savings).
i18n
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
    },
    lng: 'pt-BR',
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

// Lazy-load en-US locale when language changes
const originalChangeLanguage = i18n.changeLanguage.bind(i18n);
i18n.changeLanguage = async (lng?: string, callback?: i18n.Callback) => {
  if (lng === 'en-US' && !i18n.hasResourceBundle('en-US', 'translation')) {
    const enUS = await import('@/locales/en-US.json');
    i18n.addResourceBundle('en-US', 'translation', enUS.default, true, true);
  }
  return originalChangeLanguage(lng, callback);
};

export default i18n;
