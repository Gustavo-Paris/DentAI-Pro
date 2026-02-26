import { ptBR, enUS } from 'date-fns/locale';
import i18n from '@/lib/i18n';

export function getDateLocale() {
  return i18n.language?.startsWith('en') ? enUS : ptBR;
}

export function getDateFormat(format: 'short' | 'medium' | 'long' | 'greeting') {
  const isEn = i18n.language?.startsWith('en');
  switch (format) {
    case 'short': return isEn ? 'MMM d' : "d 'de' MMM";
    case 'medium': return isEn ? 'MMM d, yyyy' : "d 'de' MMM, yyyy";
    case 'long': return isEn ? 'MMMM d, yyyy' : "d 'de' MMMM 'de' yyyy";
    case 'greeting': return isEn ? 'EEEE, MMMM d' : "EEEE, d 'de' MMMM";
  }
}
