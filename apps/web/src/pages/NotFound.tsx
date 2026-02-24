import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { logger } from "@/lib/logger";
import { ArrowLeft } from "lucide-react";
import { Button } from "@parisgroup-ai/pageshell/primitives";

// Not using PageShell composite: minimal centered 404 page — no composite fits this
// intentionally simple layout with route logging side-effects.
const NotFound = () => {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.notFound', { defaultValue: 'Página não encontrada' }));
  const location = useLocation();

  useEffect(() => {
    logger.info("404: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <p className="text-6xl font-semibold font-display text-muted-foreground/50 mb-2" aria-hidden="true">404</p>
        <h1 className="text-xl font-semibold font-display mb-2">{t('errors.pageNotFound')}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {t('errors.pageNotFoundDescription')}
        </p>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            {t('common.backToHome')}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
