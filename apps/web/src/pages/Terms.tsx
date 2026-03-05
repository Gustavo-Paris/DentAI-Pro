import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { BRAND_NAME } from '@/lib/branding';
import { LegalPageLayout } from '@/components/shared/LegalPageLayout';

const sectionHeadingClass = "text-xl font-semibold font-display mb-3";

// Not using PageShell composite: static legal page with branded header — DetailPage
// is designed for data-fetched entity views, not static content with custom navigation.
export default function Terms() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.terms'));
  const b = { brandName: BRAND_NAME };
  return (
    <LegalPageLayout title={t('pages.termsTitle')}>
      <p className="text-muted-foreground">
        {t('pages.lastUpdated')} 05/03/2026
      </p>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s1Title')}</h2>
        <p className="text-muted-foreground">{t('pages.terms.s1Text', b)}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s2Title')}</h2>
        <p className="text-muted-foreground">{t('pages.terms.s2Text', b)}</p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>{t('pages.terms.s2Item1')}</li>
          <li>{t('pages.terms.s2Item2')}</li>
          <li>{t('pages.terms.s2Item3')}</li>
          <li>{t('pages.terms.s2Item4')}</li>
        </ul>
        <p className="text-muted-foreground mt-2 font-medium">{t('pages.terms.s2Closing', b)}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s3Title')}</h2>
        <p className="text-muted-foreground">
          <strong>{t('pages.terms.s3Important')}</strong> {t('pages.terms.s3Text1', b)}
        </p>
        <p className="text-muted-foreground mt-2">{t('pages.terms.s3Text2')}</p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>{t('pages.terms.s3Factor1')}</li>
          <li>{t('pages.terms.s3Factor2')}</li>
          <li>{t('pages.terms.s3Factor3')}</li>
          <li>{t('pages.terms.s3Factor4')}</li>
          <li>{t('pages.terms.s3Factor5')}</li>
          <li>{t('pages.terms.s3Factor6')}</li>
          <li>{t('pages.terms.s3Factor7')}</li>
          <li>{t('pages.terms.s3Factor8')}</li>
        </ul>
        <p className="text-muted-foreground mt-2">{t('pages.terms.s3Text3')}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s4Title')}</h2>
        <p className="text-muted-foreground">{t('pages.terms.s4Text1', b)}</p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>{t('pages.terms.s4Item1')}</li>
          <li>{t('pages.terms.s4Item2')}</li>
          <li>{t('pages.terms.s4Item3')}</li>
          <li>{t('pages.terms.s4Item4')}</li>
          <li>{t('pages.terms.s4Item5')}</li>
        </ul>
        <p className="text-muted-foreground mt-2">{t('pages.terms.s4Text2', b)}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s5Title')}</h2>
        <p className="text-muted-foreground">{t('pages.terms.s5Intro')}</p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>{t('pages.terms.s5Item1')}</li>
          <li>{t('pages.terms.s5Item2')}</li>
          <li>{t('pages.terms.s5Item3')}</li>
          <li>{t('pages.terms.s5Item4')}</li>
          <li>{t('pages.terms.s5Item5')}</li>
          <li>{t('pages.terms.s5Item6')}</li>
          <li>{t('pages.terms.s5Item7')}</li>
          <li>{t('pages.terms.s5Item8')}</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s6Title')}</h2>
        <p className="text-muted-foreground">{t('pages.terms.s6Text1')}</p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>{t('pages.terms.s6Item1')}</li>
          <li>{t('pages.terms.s6Item2')}</li>
          <li>{t('pages.terms.s6Item3')}</li>
          <li>{t('pages.terms.s6Item4')}</li>
          <li>{t('pages.terms.s6Item5')}</li>
          <li>{t('pages.terms.s6Item6')}</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s7Title')}</h2>
        <p className="text-muted-foreground">{t('pages.terms.s7Text', b)}</p>
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
        <p className="text-muted-foreground">{t('pages.terms.s10Text')}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s11Title')}</h2>
        <p className="text-muted-foreground">{t('pages.terms.s11Text')}</p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>{t('pages.terms.s12Title')}</h2>
        <p className="text-muted-foreground">
          {t('pages.terms.s12Text')}{' '}
          <a href="mailto:contato@tosmile.ai" className="text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded">contato@tosmile.ai</a>
        </p>
      </section>
    </LegalPageLayout>
  );
}
