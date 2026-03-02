import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Strip diacritics and capitalize for i18n key building: "média" → "Media" */
export function toI18nKeySuffix(value: string): string {
  const stripped = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
