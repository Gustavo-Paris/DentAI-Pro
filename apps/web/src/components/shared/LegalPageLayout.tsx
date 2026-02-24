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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border" aria-label={t('common.siteNavigation', { defaultValue: 'Navegação do site' })}>
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-semibold font-display mb-8">{title}</h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
