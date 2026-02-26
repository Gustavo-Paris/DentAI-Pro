import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Shield, Zap, Palette } from 'lucide-react';
import { BRAND_NAME } from '@/lib/branding';

interface AuthLayoutProps {
  title: ReactNode;
  subtitle: ReactNode;
  children: ReactNode;
}

const FEATURES = [
  { icon: Sparkles, key: 'auth.feature1', fallback: 'IA que analisa e recomenda' },
  { icon: Shield, key: 'auth.feature2', fallback: 'Dados protegidos e seguros' },
  { icon: Zap, key: 'auth.feature3', fallback: 'Resultados em segundos' },
  { icon: Palette, key: 'auth.feature4', fallback: 'Protocolos personalizados' },
] as const;

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-background flex">
      {/* Brand panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden grain-overlay bg-background" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgb(var(--color-primary-rgb)/0.08),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgb(var(--color-primary-rgb)/0.05),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgb(var(--color-primary-rgb)/0.03),_transparent_40%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, var(--color-foreground) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute inset-0 ai-grid-pattern opacity-30 dark:opacity-50" style={{ maskImage: 'radial-gradient(ellipse 60% 50% at 40% 50%, black 20%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 40% 50%, black 20%, transparent 70%)' }} />

        {/* Floating glow orbs */}
        <div className="glow-orb w-64 h-64 bg-primary/15 dark:bg-primary/25 top-[10%] left-[-10%]" />
        <div className="glow-orb glow-orb-slow glow-orb-reverse w-48 h-48 bg-accent/10 dark:bg-accent/15 bottom-[20%] right-[5%]" />

        {/* Decorative tooth watermark */}
        <svg
          className="absolute bottom-8 right-8 w-64 h-64 xl:w-72 xl:h-72 opacity-[0.06] pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          fill="none"
        >
          <defs>
            <linearGradient id="tooth-wm" x1="16" y1="10" x2="48" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgb(var(--color-primary-rgb))" />
              <stop offset="100%" stopColor="rgb(var(--color-primary-rgb))" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path
            d="M22 15C18 15 14 19 14 25C14 32 19 38 23 43C25 46.5 27 51 29 51C30.5 51 31.2 47.5 32 44C32.8 47.5 33.5 51 35 51C37 51 39 46.5 41 43C45 38 50 32 50 25C50 19 46 15 42 15C38.5 15 36 17 34 19.5L32 22L30 19.5C28 17 25.5 15 22 15Z"
            fill="url(#tooth-wm)"
          />
          <path
            d="M20 26C24 30 28 31.5 32 31.5C36 31.5 40 30 44 26"
            stroke="rgb(var(--color-primary-rgb))"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.4"
          />
        </svg>

        <div className="relative flex flex-col h-full px-12 xl:px-16 py-12 xl:py-16">
          {/* Brand & headline */}
          <div className="flex flex-col justify-center flex-1">
            <span className="font-display tracking-[0.2em] text-gradient-brand text-2xl font-semibold mb-6 animate-[fade-in-up_0.6s_ease-out_0.2s_both]">{BRAND_NAME}</span>
            <h2 className="text-3xl xl:text-4xl font-display font-semibold tracking-tight mb-3 animate-[fade-in-up_0.6s_ease-out_0.3s_both] neon-text">{t('landing.brandSlogan')}</h2>
            <p className="text-muted-foreground text-lg mb-10 animate-[fade-in-up_0.6s_ease-out_0.4s_both]">{t('landing.brandDescription')}</p>

            {/* Feature highlights */}
            <ul className="space-y-4 animate-[fade-in-up_0.6s_ease-out_0.5s_both]">
              {FEATURES.map(({ icon: Icon, key, fallback }) => (
                <li key={key} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0 glow-icon">
                    <Icon className="w-4 h-4" />
                  </span>
                  {t(key, { defaultValue: fallback })}
                </li>
              ))}
            </ul>
          </div>

          {/* Social proof */}
          <p className="text-xs text-muted-foreground mt-auto pb-2 animate-[fade-in-up_0.6s_ease-out_0.7s_both]">
            {t('auth.socialProof', { defaultValue: 'Utilizado por dentistas em todo o Brasil' })}
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 dark:bg-gradient-to-b dark:from-card/50 dark:to-background">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6 sm:mb-8">
            <Link to="/" className="font-display tracking-[0.2em] text-gradient-brand text-lg sm:text-xl font-semibold lg:hidden animate-[fade-in-up_0.6s_ease-out_0.2s_both]">
              {BRAND_NAME}
            </Link>
            <h1 className="text-xl sm:text-2xl font-semibold font-display mt-6 sm:mt-8 lg:mt-0 mb-2 animate-[fade-in-up_0.6s_ease-out_0.3s_both] neon-text">
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
