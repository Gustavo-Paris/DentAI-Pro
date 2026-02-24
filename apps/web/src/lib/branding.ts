import i18n from '@/lib/i18n';

// Centralized branding constants for easy future updates
export const BRAND_NAME = "ToSmile.ai";
export const getBrandTagline = () => i18n.t('brand.tagline', { defaultValue: 'Odontologia Digital Inteligente' });
export const getBrandDescription = () => i18n.t('brand.description', { defaultValue: 'IA que analisa, planeja e gera protocolos com precisão para odontologia estética.' });

// Storage key prefix
export const STORAGE_PREFIX = "tosmile";

// Welcome modal key
export const WELCOME_STORAGE_KEY = `${STORAGE_PREFIX}-welcome-dismissed`;
