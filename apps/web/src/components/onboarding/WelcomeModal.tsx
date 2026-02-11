import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BRAND_NAME } from '@/lib/branding';
import { Camera, Sparkles, FileText, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'auria-welcome-dismissed';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  onTrySample: () => void;
  onCreateCase: () => void;
}


export function WelcomeModal({ open, onClose, onTrySample, onCreateCase }: WelcomeModalProps) {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 'welcome',
      title: `${t('components.onboarding.welcome.welcomeTo')} ${BRAND_NAME}`,
      description: t('components.onboarding.welcome.description'),
      illustration: (
        <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
      ),
    },
    {
      id: 'how-it-works',
      title: t('components.onboarding.welcome.howItWorks'),
      description: t('components.onboarding.welcome.howItWorksDesc'),
      illustration: (
        <div className="flex items-center justify-center gap-3">
          {[
            { icon: Camera, label: t('components.onboarding.welcome.photoStep'), color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' },
            { icon: Sparkles, label: t('components.onboarding.welcome.aiStep'), color: 'bg-primary/10 text-primary' },
            { icon: FileText, label: t('components.onboarding.welcome.protocolStep'), color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center', step.color)}>
                  <step.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
              </div>
              {i < 2 && <ArrowRight className="w-4 h-4 text-muted-foreground/50 -mt-4" />}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'get-started',
      title: t('components.onboarding.welcome.getStarted'),
      description: t('components.onboarding.welcome.getStartedDesc'),
      illustration: null,
    },
  ];

  const isLast = currentSlide === slides.length - 1;
  const isFirst = currentSlide === 0;
  const slide = slides[currentSlide];

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onClose();
  };

  const handleTrySample = () => {
    handleDismiss();
    onTrySample();
  };

  const handleCreateCase = () => {
    handleDismiss();
    onCreateCase();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-8 pb-6 text-center space-y-5">
          {/* Illustration */}
          {slide.illustration && <div className="mb-2">{slide.illustration}</div>}

          {/* Title */}
          <h2 className="text-xl font-semibold font-display">
            {slide.id === 'welcome' ? (
              <>
                {t('components.onboarding.welcome.welcomeTo')}{' '}
                <span className="text-primary font-semibold">{BRAND_NAME}</span>
              </>
            ) : (
              slide.title
            )}
          </h2>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {slide.description}
          </p>

          {/* CTA buttons on last slide */}
          {isLast && (
            <div className="flex flex-col gap-2.5 pt-2">
              <Button onClick={handleTrySample} className="w-full btn-glow-gold btn-press font-semibold">
                {t('components.onboarding.welcome.trySample')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={handleCreateCase} className="w-full btn-press">
                {t('components.onboarding.welcome.createEvaluation')}
              </Button>
            </div>
          )}
        </div>

        {/* Footer: nav dots + prev/next */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary/30">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentSlide((s) => s - 1)}
            disabled={isFirst}
            className={cn('gap-1', isFirst && 'invisible')}
          >
            <ChevronLeft className="w-4 h-4" />
            {t('components.onboarding.welcome.back')}
          </Button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  i === currentSlide
                    ? 'bg-primary w-5'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50',
                )}
                aria-label={t('components.onboarding.welcome.slideLabel', { index: i + 1 })}
              />
            ))}
          </div>

          {/* Next button */}
          {!isLast ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentSlide((s) => s + 1)}
              className="gap-1"
            >
              {t('components.onboarding.welcome.next')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-muted-foreground"
            >
              {t('components.onboarding.welcome.skip')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { STORAGE_KEY as WELCOME_STORAGE_KEY };
