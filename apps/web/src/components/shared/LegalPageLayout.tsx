import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@parisgroup-ai/pageshell/primitives';
import { ArrowLeft } from 'lucide-react';
import { BRAND_NAME } from '@/lib/branding';

interface LegalPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  const { t } = useTranslation();
  return (
    <div className="section-glow-bg relative min-h-screen bg-background">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="glow-orb"
          style={{
            width: 400,
            height: 400,
            top: '5%',
            left: '10%',
            background:
              'radial-gradient(circle, rgb(var(--color-primary-rgb) / 0.08) 0%, transparent 70%)',
          }}
        />
        <div
          className="glow-orb glow-orb-slow"
          style={{
            width: 350,
            height: 350,
            top: '50%',
            right: '5%',
            background:
              'radial-gradient(circle, rgb(var(--accent-violet-rgb) / 0.06) 0%, transparent 70%)',
            animationDelay: '5s',
          }}
        />
      </div>

      {/* Ambient AI grid overlay */}
      <div className="ai-grid-pattern absolute inset-0 opacity-30 dark:opacity-50 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none" aria-hidden="true" />

      <div className="relative">
        <header
          className="border-b border-border"
          aria-label={t('common.siteNavigation')}
          style={{ animation: 'fade-in-up 0.6s ease-out 0s both' }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link to="/" className="text-xl font-display font-semibold text-gradient-brand">
              {BRAND_NAME}
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                {t('common.back')}
              </Button>
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
          <div style={{ animation: 'fade-in-up 0.6s ease-out 0.1s both' }}>
            <h1 className="text-heading text-2xl sm:text-3xl font-semibold font-display mb-2">{title}</h1>
          </div>
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
