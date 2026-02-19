import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BRAND_NAME } from '@/lib/branding';

interface AuthLayoutProps {
  title: ReactNode;
  subtitle: ReactNode;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-background flex">
      {/* Brand panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden grain-overlay bg-background" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_hsl(var(--primary)/0.08),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(var(--primary)/0.05),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.03),_transparent_40%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, var(--color-foreground) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex flex-col justify-center px-12 xl:px-16">
          <span className="font-display tracking-[0.2em] text-gradient-gold text-2xl font-semibold mb-6 animate-[fade-in-up_0.6s_ease-out_0.2s_both]">{BRAND_NAME}</span>
          <h2 className="text-3xl xl:text-4xl font-display font-semibold tracking-tight mb-3 animate-[fade-in-up_0.6s_ease-out_0.3s_both]">{t('landing.brandSlogan')}</h2>
          <p className="text-muted-foreground text-lg animate-[fade-in-up_0.6s_ease-out_0.4s_both]">{t('landing.brandDescription')}</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6 sm:mb-8">
            <Link to="/" className="font-display tracking-[0.2em] text-gradient-gold text-lg sm:text-xl font-semibold lg:hidden animate-[fade-in-up_0.6s_ease-out_0.2s_both]">
              {BRAND_NAME}
            </Link>
            <h1 className="text-xl sm:text-2xl font-semibold font-display mt-6 sm:mt-8 mb-2 animate-[fade-in-up_0.6s_ease-out_0.3s_both]">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground animate-[fade-in-up_0.6s_ease-out_0.3s_both]">
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </div>
    </main>
  );
}
