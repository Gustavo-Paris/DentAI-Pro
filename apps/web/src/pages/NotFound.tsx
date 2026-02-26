import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { logger } from "@/lib/logger";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@parisgroup-ai/pageshell/primitives";
import { BRAND_NAME } from '@/lib/branding';

// Not using PageShell composite: minimal centered 404 page — no composite fits this
// intentionally simple layout with route logging side-effects.
export default function NotFound() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.notFound'));
  const location = useLocation();

  useEffect(() => {
    logger.info("404: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link to="/" className="font-display tracking-[0.2em] text-gradient-brand text-lg font-semibold">
            {BRAND_NAME}
          </Link>
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <SearchX className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" aria-hidden="true" />
          <p className="text-6xl font-semibold font-display text-muted-foreground/50 mb-2" aria-hidden="true">404</p>
          <h1 className="text-xl font-semibold font-display mb-2">{t('errors.pageNotFound')}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {t('errors.pageNotFoundDescription')}
          </p>
          <Button asChild className="btn-glow">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              {t('common.backToHome')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
