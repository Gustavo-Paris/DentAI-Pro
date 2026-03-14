import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '@/components/BrandMark';

export function LandingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="py-6 sm:py-8 bg-background">
      <div className="glow-divider mb-6 sm:mb-8" />
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="text-xs sm:text-sm text-muted-foreground">
              © {new Date().getFullYear()}
            </span>
            <BrandMark size="xs" />
            <span className="text-xs sm:text-sm text-muted-foreground">
              {t('landing.footer')}
            </span>
          </div>
          <nav aria-label={t('landing.footerNav')} className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground hover:underline underline-offset-4 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded">
              {t('landing.termsOfUse')}
            </Link>
            <Link to="/privacy" className="hover:text-foreground hover:underline underline-offset-4 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded">
              {t('landing.privacy')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
