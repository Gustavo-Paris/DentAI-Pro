import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { BRAND_NAME } from '@/lib/branding';
import { LegalPageLayout } from '@/components/shared/LegalPageLayout';

const sectionHeadingClass = "text-xl font-semibold font-display mb-3";

// Not using PageShell composite: static legal page with branded header — DetailPage
// is designed for data-fetched entity views, not static content with custom navigation.
export default function Privacy() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.privacy'));
  const b = { brandName: BRAND_NAME };
  return (
    <LegalPageLayout title={t('pages.privacyTitle')}>
      <p className="text-muted-foreground">
        {t('pages.lastUpdated')} 24/02/2026
      </p>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s1Title')}</h2>
        <p className="text-muted-foreground">{t('pages.privacy.s1Text', b)}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s2Title')}</h2>
        <p className="text-muted-foreground">{t('pages.privacy.s2Intro')}</p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li><strong>{t('pages.privacy.s2Item1Label')}</strong> {t('pages.privacy.s2Item1Text')}</li>
          <li><strong>{t('pages.privacy.s2Item2Label')}</strong> {t('pages.privacy.s2Item2Text')}</li>
          <li><strong>{t('pages.privacy.s2Item3Label')}</strong> {t('pages.privacy.s2Item3Text')}</li>
          <li><strong>{t('pages.privacy.s2Item4Label')}</strong> {t('pages.privacy.s2Item4Text')}</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s3Title')}</h2>
        <p className="text-muted-foreground">{t('pages.privacy.s3Intro')}</p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>{t('pages.privacy.s3Item1')}</li>
          <li>{t('pages.privacy.s3Item2')}</li>
          <li>{t('pages.privacy.s3Item3')}</li>
          <li>{t('pages.privacy.s3Item4')}</li>
          <li>{t('pages.privacy.s3Item5')}</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s4Title')}</h2>
        <p className="text-muted-foreground">{t('pages.privacy.s4Text')}</p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>{t('pages.privacy.s4Item1')}</li>
          <li>{t('pages.privacy.s4Item2')}</li>
          <li>{t('pages.privacy.s4Item3')}</li>
          <li>{t('pages.privacy.s4Item4')}</li>
          <li>{t('pages.privacy.s4Item5')}</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s5Title')}</h2>
        <p className="text-muted-foreground">{t('pages.privacy.s5Text')}</p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>{t('pages.privacy.s5Item1')}</li>
          <li>{t('pages.privacy.s5Item2')}</li>
          <li>{t('pages.privacy.s5Item3')}</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s6Title')}</h2>
        <p className="text-muted-foreground">{t('pages.privacy.s6Intro')}</p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li><strong>{t('pages.privacy.s6Item1Label')}</strong> {t('pages.privacy.s6Item1Text')}</li>
          <li><strong>{t('pages.privacy.s6Item2Label')}</strong> {t('pages.privacy.s6Item2Text')}</li>
          <li><strong>{t('pages.privacy.s6Item3Label')}</strong> {t('pages.privacy.s6Item3Text')}</li>
          <li><strong>{t('pages.privacy.s6Item4Label')}</strong> {t('pages.privacy.s6Item4Text')}</li>
          <li><strong>{t('pages.privacy.s6Item5Label')}</strong> {t('pages.privacy.s6Item5Text')}</li>
          <li><strong>{t('pages.privacy.s6Item6Label')}</strong> {t('pages.privacy.s6Item6Text')}</li>
        </ul>
        <p className="text-muted-foreground mt-2">
          {t('pages.privacy.s6Contact')} <a href="mailto:privacidade@tosmile.ai" className="text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded">privacidade@tosmile.ai</a>
        </p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s7Title')}</h2>
        <p className="text-muted-foreground">{t('pages.privacy.s7Text')}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s8Title')}</h2>
        <p className="text-muted-foreground">{t('pages.privacy.s8Text')}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s9Title')}</h2>
        <p className="text-muted-foreground">{t('pages.privacy.s9Text', b)}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s10Title')}</h2>
        <p className="text-muted-foreground">{t('pages.privacy.s10Text')}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.privacy.s11Title')}</h2>
        <p className="text-muted-foreground">{t('pages.privacy.s11Text')}</p>
        <ul className="list-none text-muted-foreground mt-2 space-y-1">
          <li><strong>{t('pages.privacy.s11EmailLabel')}</strong> <a href="mailto:privacidade@tosmile.ai" className="text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded">privacidade@tosmile.ai</a></li>
          <li><strong>{t('pages.privacy.s11DpoLabel')}</strong> <a href="mailto:dpo@tosmile.ai" className="text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded">dpo@tosmile.ai</a></li>
        </ul>
      </section>
    </LegalPageLayout>
  );
}
