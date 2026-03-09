import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { BRAND_NAME } from '@/lib/branding';
import { LegalPageLayout } from '@/components/shared/LegalPageLayout';
import { Shield } from 'lucide-react';

const sectionHeadingClass = "text-heading text-xl font-semibold font-display mb-4";
const subHeadingClass = "text-heading text-lg font-semibold font-display mb-2 mt-4";

// Not using PageShell composite: static legal page with branded header — DetailPage
// is designed for data-fetched entity views, not static content with custom navigation.
export default function Privacy() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.privacy'));
  const b = { brandName: BRAND_NAME };
  return (
    <LegalPageLayout title={t('pages.privacyTitle')}>
      <p className="text-sm text-muted-foreground" style={{ animation: 'fade-in-up 0.6s ease-out 0.15s both' }}>
        {t('pages.lastUpdated')} 05/03/2026
      </p>

      {/* LGPD compliance badge */}
      <div
        className="glass-panel rounded-lg px-4 py-3 inline-flex items-center gap-3"
        style={{ animation: 'fade-in-up 0.6s ease-out 0.2s both' }}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10">
          <Shield className="w-4 h-4 text-success" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {t('pages.privacy.lgpdBadgeTitle')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('pages.privacy.lgpdBadgeSubtitle')}
          </p>
        </div>
      </div>

      <section className="glass-panel rounded-xl p-6 sm:p-8" style={{ animation: 'fade-in-up 0.6s ease-out 0.3s both' }}>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s1Title')}</h2>
        <p className="text-muted-foreground leading-relaxed">{t('pages.privacy.s1Text', b)}</p>
      </section>

      <section className="glass-panel rounded-xl p-6 sm:p-8" style={{ animation: 'fade-in-up 0.6s ease-out 0.45s both' }}>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s2Title')}</h2>
        <p className="text-muted-foreground leading-relaxed">{t('pages.privacy.s2Intro')}</p>
        <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
          <li className="leading-relaxed"><strong>{t('pages.privacy.s2Item1Label')}</strong> {t('pages.privacy.s2Item1Text')}</li>
          <li className="leading-relaxed"><strong>{t('pages.privacy.s2Item2Label')}</strong> {t('pages.privacy.s2Item2Text')}</li>
          <li className="leading-relaxed"><strong>{t('pages.privacy.s2Item3Label')}</strong> {t('pages.privacy.s2Item3Text')}</li>
          <li className="leading-relaxed"><strong>{t('pages.privacy.s2Item4Label')}</strong> {t('pages.privacy.s2Item4Text')}</li>
          <li className="leading-relaxed"><strong>{t('pages.privacy.s2Item5Label')}</strong> {t('pages.privacy.s2Item5Text')}</li>
        </ul>
      </section>

      <section className="glass-panel rounded-xl p-6 sm:p-8" style={{ animation: 'fade-in-up 0.6s ease-out 0.6s both' }}>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s3Title')}</h2>
        <p className="text-muted-foreground leading-relaxed">{t('pages.privacy.s3Intro')}</p>
        <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
          <li className="leading-relaxed"><strong>{t('pages.privacy.s3Item1Label')}</strong> {t('pages.privacy.s3Item1Text')}</li>
          <li className="leading-relaxed"><strong>{t('pages.privacy.s3Item2Label')}</strong> {t('pages.privacy.s3Item2Text')}</li>
          <li className="leading-relaxed"><strong>{t('pages.privacy.s3Item3Label')}</strong> {t('pages.privacy.s3Item3Text')}</li>
        </ul>
      </section>

      <section className="glass-panel rounded-xl p-6 sm:p-8" style={{ animation: 'fade-in-up 0.6s ease-out 0.75s both' }}>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s4Title')}</h2>
        <p className="text-muted-foreground leading-relaxed">{t('pages.privacy.s4Intro')}</p>

        <h3 className={subHeadingClass}>{t('pages.privacy.s4Sub1Title')}</h3>
        <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
          <li className="leading-relaxed">{t('pages.privacy.s4Sub1Item1')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s4Sub1Item2')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s4Sub1Item3')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s4Sub1Item4')}</li>
        </ul>

        <h3 className={subHeadingClass}>{t('pages.privacy.s4Sub2Title')}</h3>
        <p className="text-muted-foreground leading-relaxed">{t('pages.privacy.s4Sub2Text')}</p>
        <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
          <li className="leading-relaxed"><strong>{t('pages.privacy.s4Sub2Item1Label')}</strong> {t('pages.privacy.s4Sub2Item1Text')}</li>
          <li className="leading-relaxed"><strong>{t('pages.privacy.s4Sub2Item2Label')}</strong> {t('pages.privacy.s4Sub2Item2Text')}</li>
        </ul>
        <p className="text-muted-foreground mt-3 leading-relaxed">{t('pages.privacy.s4Sub2Closing')}</p>

        <h3 className={subHeadingClass}>{t('pages.privacy.s4Sub3Title')}</h3>
        <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
          <li className="leading-relaxed">{t('pages.privacy.s4Sub3Item1')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s4Sub3Item2')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s4Sub3Item3')}</li>
        </ul>

        <h3 className={subHeadingClass}>{t('pages.privacy.s4Sub4Title')}</h3>
        <p className="text-muted-foreground leading-relaxed">{t('pages.privacy.s4Sub4Text')}</p>
      </section>

      <section className="glass-panel rounded-xl p-6 sm:p-8" style={{ animation: 'fade-in-up 0.6s ease-out 0.9s both' }}>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s5Title')}</h2>
        <p className="text-muted-foreground leading-relaxed">{t('pages.privacy.s5Intro')}</p>
        <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
          <li className="leading-relaxed">{t('pages.privacy.s5Item1')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s5Item2')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s5Item3')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s5Item4')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s5Item5')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s5Item6')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s5Item7')}</li>
        </ul>
      </section>

      <section className="glass-panel rounded-xl p-6 sm:p-8" style={{ animation: 'fade-in-up 0.6s ease-out 1.05s both' }}>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s6Title')}</h2>
        <p className="text-muted-foreground leading-relaxed">{t('pages.privacy.s6Text')}</p>
        <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
          <li className="leading-relaxed">{t('pages.privacy.s6Item1')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s6Item2')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s6Item3')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s6Item4')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s6Item5')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s6Item6')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s6Item7')}</li>
        </ul>
      </section>

      <section className="glass-panel rounded-xl p-6 sm:p-8" style={{ animation: 'fade-in-up 0.6s ease-out 1.2s both' }}>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s7Title')}</h2>
        <p className="text-muted-foreground leading-relaxed">{t('pages.privacy.s7Text')}</p>
        <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
          <li className="leading-relaxed">{t('pages.privacy.s7Item1')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s7Item2')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s7Item3')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s7Item4')}</li>
          <li className="leading-relaxed">{t('pages.privacy.s7Item5')}</li>
        </ul>
      </section>

      <section className="glass-panel rounded-xl p-6 sm:p-8" style={{ animation: 'fade-in-up 0.6s ease-out 1.35s both' }}>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s8Title')}</h2>
        <p className="text-muted-foreground leading-relaxed">{t('pages.privacy.s8Intro')}</p>
        <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
          <li className="leading-relaxed"><strong>{t('pages.privacy.s8Item1Label')}</strong> {t('pages.privacy.s8Item1Text')}</li>
          <li className="leading-relaxed"><strong>{t('pages.privacy.s8Item2Label')}</strong> {t('pages.privacy.s8Item2Text')}</li>
          <li className="leading-relaxed"><strong>{t('pages.privacy.s8Item3Label')}</strong> {t('pages.privacy.s8Item3Text')}</li>
          <li className="leading-relaxed"><strong>{t('pages.privacy.s8Item4Label')}</strong> {t('pages.privacy.s8Item4Text')}</li>
          <li className="leading-relaxed"><strong>{t('pages.privacy.s8Item5Label')}</strong> {t('pages.privacy.s8Item5Text')}</li>
          <li className="leading-relaxed"><strong>{t('pages.privacy.s8Item6Label')}</strong> {t('pages.privacy.s8Item6Text')}</li>
          <li className="leading-relaxed"><strong>{t('pages.privacy.s8Item7Label')}</strong> {t('pages.privacy.s8Item7Text')}</li>
        </ul>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          {t('pages.privacy.s8Contact')} <a href="mailto:privacidade@tosmile.ai" className="text-primary hover:underline transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded">privacidade@tosmile.ai</a>
        </p>
      </section>

      <section className="glass-panel rounded-xl p-6 sm:p-8" style={{ animation: 'fade-in-up 0.6s ease-out 1.5s both' }}>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s9Title')}</h2>
        <p className="text-muted-foreground leading-relaxed">{t('pages.privacy.s9Text')}</p>
      </section>

      <section className="glass-panel rounded-xl p-6 sm:p-8" style={{ animation: 'fade-in-up 0.6s ease-out 1.65s both' }}>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s10Title')}</h2>
        <p className="text-muted-foreground leading-relaxed">{t('pages.privacy.s10Text')}</p>
      </section>

      <section className="glass-panel rounded-xl p-6 sm:p-8" style={{ animation: 'fade-in-up 0.6s ease-out 1.8s both' }}>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s11Title')}</h2>
        <p className="text-muted-foreground leading-relaxed">{t('pages.privacy.s11Text', b)}</p>
      </section>

      <section className="glass-panel rounded-xl p-6 sm:p-8" style={{ animation: 'fade-in-up 0.6s ease-out 1.95s both' }}>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s12Title')}</h2>
        <p className="text-muted-foreground leading-relaxed">{t('pages.privacy.s12Text', b)}</p>
      </section>

      <section className="glass-panel rounded-xl p-6 sm:p-8" style={{ animation: 'fade-in-up 0.6s ease-out 2.1s both' }}>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s13Title')}</h2>
        <p className="text-muted-foreground leading-relaxed">{t('pages.privacy.s13Text')}</p>
      </section>

      <section className="glass-panel rounded-xl p-6 sm:p-8" style={{ animation: 'fade-in-up 0.6s ease-out 2.25s both' }}>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s14Title')}</h2>
        <p className="text-muted-foreground leading-relaxed">{t('pages.privacy.s14Text')}</p>
        <ul className="list-none text-muted-foreground mt-3 space-y-2">
          <li className="leading-relaxed"><strong>{t('pages.privacy.s14EmailLabel')}</strong> <a href="mailto:privacidade@tosmile.ai" className="text-primary hover:underline transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded">privacidade@tosmile.ai</a></li>
          <li className="leading-relaxed"><strong>{t('pages.privacy.s14DpoLabel')}</strong> <a href="mailto:dpo@tosmile.ai" className="text-primary hover:underline transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded">dpo@tosmile.ai</a></li>
        </ul>
      </section>
    </LegalPageLayout>
  );
}
