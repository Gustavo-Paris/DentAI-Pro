import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@parisgroup-ai/pageshell/primitives';
import { BRAND_NAME } from '@/lib/branding';
import { ThemeToggle } from '@/components/ThemeToggle';

export function LandingHeader() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50 glass-nav">
      <nav className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between" aria-label={t('landing.navAriaLabel')}>
        <span className="text-lg sm:text-xl font-semibold tracking-[0.2em] font-display text-gradient-brand">{BRAND_NAME}</span>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost" size="sm" className="min-h-11">{t('landing.login')}</Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="min-h-11">{t('landing.start')}</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
