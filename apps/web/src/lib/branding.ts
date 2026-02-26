import i18n from '@/lib/i18n';

// Centralized branding constants for easy future updates
export const BRAND_NAME = "ToSmile.ai";
export const getBrandTagline = () => i18n.t('brand.tagline');
export const getBrandDescription = () => i18n.t('brand.description');

// Storage key prefix
export const STORAGE_PREFIX = "tosmile";

// Welcome modal key
export const WELCOME_STORAGE_KEY = `${STORAGE_PREFIX}-welcome-dismissed`;
