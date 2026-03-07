import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@parisgroup-ai/pageshell/primitives';
import { BRAND_NAME } from '@/lib/branding';

export function LandingFAQ() {
  const { t } = useTranslation();

  return (
    <section aria-label={t('landing.faqTitle')} className="py-12 sm:py-20 bg-secondary/20 relative overflow-hidden section-glow-bg">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-8 sm:mb-12 font-display neon-text">
          {t('landing.faqTitle')}
        </h2>
        <Accordion type="single" collapsible className="w-full glass-panel rounded-xl px-4 py-3 sm:px-8 sm:py-5">
          <AccordionItem value="item-1">
            <AccordionTrigger className="px-3 sm:px-4">{t('landing.faq1Q')}</AccordionTrigger>
            <AccordionContent className="px-3 sm:px-4">{t('landing.faq1A')}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="px-3 sm:px-4">{t('landing.faq2Q')}</AccordionTrigger>
            <AccordionContent className="px-3 sm:px-4">{t('landing.faq2A')}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="px-3 sm:px-4">{t('landing.faq3Q')}</AccordionTrigger>
            <AccordionContent className="px-3 sm:px-4">{t('landing.faq3A')}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger className="px-3 sm:px-4">{t('landing.faq4Q')}</AccordionTrigger>
            <AccordionContent className="px-3 sm:px-4">{t('landing.faq4A')}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger className="px-3 sm:px-4">{t('landing.faq5Q')}</AccordionTrigger>
            <AccordionContent className="px-3 sm:px-4">{t('landing.faq5A')}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-6">
            <AccordionTrigger className="px-3 sm:px-4">{t('landing.faq6Q')}</AccordionTrigger>
            <AccordionContent className="px-3 sm:px-4">{t('landing.faq6A', { brandName: BRAND_NAME })}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-7" className="border-b-0">
            <AccordionTrigger className="px-3 sm:px-4">{t('landing.faq7Q')}</AccordionTrigger>
            <AccordionContent className="px-3 sm:px-4">{t('landing.faq7A', { brandName: BRAND_NAME })}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
