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
    <div className="section-glow-bg relative min-h-screen bg-background flex flex-col">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="glow-orb"
          style={{
            width: 500,
            height: 500,
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            background:
              'radial-gradient(circle, rgb(var(--color-primary-rgb) / 0.10) 0%, transparent 70%)',
          }}
        />
        <div
          className="glow-orb glow-orb-slow"
          style={{
            width: 300,
            height: 300,
            top: '15%',
            left: '15%',
            background:
              'radial-gradient(circle, rgb(var(--accent-violet-rgb) / 0.06) 0%, transparent 70%)',
            animationDelay: '4s',
          }}
        />
      </div>

      {/* Tooth SVG watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <svg
          width="320"
          height="320"
          viewBox="0 0 100 120"
          fill="currentColor"
          className="text-foreground opacity-[0.04]"
          aria-hidden="true"
        >
          <path d="M50 5C35 5 25 15 20 25C15 35 12 50 15 65C18 80 22 90 28 100C32 107 38 115 42 115C46 115 48 105 50 95C52 105 54 115 58 115C62 115 68 107 72 100C78 90 82 80 85 65C88 50 85 35 80 25C75 15 65 5 50 5Z" />
        </svg>
      </div>

      <header className="relative border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link to="/" className="font-display tracking-[0.2em] text-gradient-brand text-lg font-semibold">
            {BRAND_NAME}
          </Link>
        </div>
      </header>
      <div className="relative flex flex-1 items-center justify-center px-4">
        <div className="fade-in-up text-center max-w-sm">
          <SearchX className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" aria-hidden="true" />
          <p className="neon-text text-8xl font-bold font-display text-primary/20 mb-2" aria-hidden="true">404</p>
          <h1 className="text-heading text-xl sm:text-2xl font-semibold font-display mb-3">{t('errors.pageNotFound')}</h1>
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
