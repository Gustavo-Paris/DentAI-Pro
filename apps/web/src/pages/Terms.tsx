import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { BRAND_NAME } from '@/lib/branding';
import { LegalPageLayout } from '@/components/shared/LegalPageLayout';

const sectionHeadingClass = "text-xl font-semibold font-display mb-3";

// Not using PageShell composite: static legal page with branded header — DetailPage
// is designed for data-fetched entity views, not static content with custom navigation.
export default function Terms() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.terms', { defaultValue: 'Termos de Uso' }));
  const b = { brandName: BRAND_NAME };
  return (
    <LegalPageLayout title={t('pages.termsTitle')}>
      <p className="text-muted-foreground">
        {t('pages.lastUpdated')} 24/02/2026
      </p>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s1Title')}</h2>
        <p className="text-muted-foreground">{t('pages.terms.s1Text', b)}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s2Title')}</h2>
        <p className="text-muted-foreground">{t('pages.terms.s2Text', b)}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s3Title')}</h2>
        <p className="text-muted-foreground">
          <strong>{t('pages.terms.s3Important')}</strong> {t('pages.terms.s3Text1', b)}
        </p>
        <p className="text-muted-foreground mt-2">{t('pages.terms.s3Text2')}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s4Title')}</h2>
        <p className="text-muted-foreground">{t('pages.terms.s4Intro')}</p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>{t('pages.terms.s4Item1')}</li>
          <li>{t('pages.terms.s4Item2')}</li>
          <li>{t('pages.terms.s4Item3')}</li>
          <li>{t('pages.terms.s4Item4')}</li>
          <li>{t('pages.terms.s4Item5')}</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s5Title')}</h2>
        <p className="text-muted-foreground">{t('pages.terms.s5Text', b)}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s6Title')}</h2>
        <p className="text-muted-foreground">{t('pages.terms.s6Text')}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s7Title')}</h2>
        <p className="text-muted-foreground">{t('pages.terms.s7Text')}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s8Title')}</h2>
        <p className="text-muted-foreground">{t('pages.terms.s8Text')}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s9Title')}</h2>
        <p className="text-muted-foreground">{t('pages.terms.s9Text')}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s10Title')}</h2>
        <p className="text-muted-foreground">
          {t('pages.terms.s10Text')}{' '}
          <a href="mailto:contato@tosmile.ai" className="text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded">contato@tosmile.ai</a>
        </p>
      </section>
    </LegalPageLayout>
  );
}
