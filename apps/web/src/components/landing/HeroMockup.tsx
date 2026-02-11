import { useTranslation } from 'react-i18next';

export function HeroMockup() {
  const { t } = useTranslation();
  return (
    <div className="relative w-full max-w-sm mx-auto animate-[fade-in-up_0.8s_ease-out_1s_both]">
      {/* Float animation wrapper */}
      <div className="animate-[hero-float_6s_ease-in-out_infinite]">
        {/* Device frame */}
        <div className="relative rounded-[2rem] border-[6px] border-foreground/10 dark:border-foreground/15 bg-background shadow-2xl shadow-primary/10 overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 py-2 bg-secondary/50">
            <span className="text-[10px] text-muted-foreground font-medium">9:41</span>
            <div className="flex gap-1">
              <div className="w-3.5 h-2 rounded-sm bg-muted-foreground/40" />
              <div className="w-1.5 h-2 rounded-sm bg-muted-foreground/40" />
            </div>
          </div>

          {/* App header */}
          <div className="px-4 py-3 border-b border-border/50">
            <div className="text-xs font-semibold tracking-[0.15em] text-primary">AURIA</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{t('components.landing.heroMockup.analysisResult')}</div>
          </div>

          {/* Content area */}
          <div className="p-4 space-y-4">
            {/* Tooth diagram */}
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 48 56" className="w-12 h-14 shrink-0" aria-hidden="true">
                <path
                  d="M24 4c-8 0-14 6-14 14 0 6 2 10 4 16 2 6 4 14 10 18 6-4 8-12 10-18 2-6 4-10 4-16 0-8-6-14-14-14z"
                  fill="none"
                  stroke="currentColor"
                  className="text-primary/60"
                  strokeWidth="2"
                />
                <path
                  d="M16 18c2-2 6-2 8 0 2-2 6-2 8 0"
                  fill="none"
                  stroke="currentColor"
                  className="text-primary/40"
                  strokeWidth="1.5"
                />
                <circle cx="24" cy="26" r="3" className="fill-primary/20 stroke-primary/50" strokeWidth="1" />
              </svg>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Dente #21</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{t('components.landing.heroMockup.resin')}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">{t('components.landing.heroMockup.vitaColor')}</div>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full w-[92%] rounded-full bg-primary" />
                  </div>
                  <span className="text-[10px] text-primary font-medium">92%</span>
                </div>
              </div>
            </div>

            {/* Protocol layers */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t('components.landing.heroMockup.protocol')}</div>
              {[
                { label: t('components.landing.heroMockup.enamel'), color: 'bg-sky-400/70 dark:bg-sky-400/50' },
                { label: t('components.landing.heroMockup.body'), color: 'bg-primary/60' },
                { label: t('components.landing.heroMockup.dentin'), color: 'bg-amber-400/70 dark:bg-amber-400/50' },
              ].map((layer) => (
                <div key={layer.label} className="flex items-center gap-2">
                  <div className={`w-full h-3 rounded ${layer.color}`} />
                  <span className="text-[10px] text-muted-foreground w-12 shrink-0">{layer.label}</span>
                </div>
              ))}
            </div>

            {/* Confidence badge */}
            <div className="flex items-center justify-between bg-secondary/60 rounded-lg px-3 py-2">
              <span className="text-[10px] text-muted-foreground">{t('components.landing.heroMockup.aiConfidence')}</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{t('components.landing.heroMockup.high')}</span>
              </div>
            </div>
          </div>

          {/* Bottom safe area */}
          <div className="h-4" />
        </div>
      </div>

      {/* Glow effect behind device */}
      <div className="absolute inset-0 -z-10 blur-3xl opacity-20 bg-gradient-to-br from-primary/40 to-transparent rounded-full scale-110" />
    </div>
  );
}
