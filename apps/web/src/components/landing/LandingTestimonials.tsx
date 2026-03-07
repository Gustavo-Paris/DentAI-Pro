import { useTranslation } from 'react-i18next';
import { Badge } from '@parisgroup-ai/pageshell/primitives';
import { Star, Zap } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { useScrollRevealChildren } from '@/hooks/useScrollReveal';

export function LandingTestimonials() {
  const { t } = useTranslation();
  const testimonialsRef = useScrollRevealChildren<HTMLDivElement>();

  return (
    <section aria-label={t('landing.testimonialsTitle')} className="py-16 sm:py-24 bg-background relative overflow-hidden section-glow-bg">
      <div className="glow-orb glow-orb-slow w-56 h-56 bg-primary/10 dark:bg-primary/15 top-[-15%] right-[-5%]" />
      <div className="glow-orb glow-orb-reverse w-40 h-40 bg-[rgb(var(--accent-violet-rgb)/0.08)] dark:bg-[rgb(var(--accent-violet-rgb)/0.10)] bottom-[10%] left-[-8%]" />
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-10 sm:mb-16 font-display neon-text">
          {t('landing.testimonialsTitle')}
        </h2>
        <div ref={testimonialsRef} className="grid md:grid-cols-2 gap-6">
          {/* Gradient colors are intentional brand accent colors — each testimonial gets a distinct hue for visual variety */}
          {[
            {
              quote: t('landing.testimonial1Quote'),
              author: t('landing.testimonial1Author'),
              role: t('landing.testimonial1Role'),
              clinic: t('landing.testimonial1Clinic'),
              rating: 5,
              gradient: 'from-primary/20 to-primary/5',
              highlight: t('landing.testimonial1Highlight'),
            },
            {
              quote: t('landing.testimonial2Quote'),
              author: t('landing.testimonial2Author'),
              role: t('landing.testimonial2Role'),
              clinic: t('landing.testimonial2Clinic'),
              rating: 5,
              gradient: 'from-[rgb(var(--accent-violet-rgb)/0.2)] to-[rgb(var(--accent-violet-rgb)/0.05)]',
              highlight: null,
            },
            {
              quote: t('landing.testimonial3Quote'),
              author: t('landing.testimonial3Author'),
              role: t('landing.testimonial3Role'),
              clinic: t('landing.testimonial3Clinic'),
              rating: 4,
              gradient: 'from-[rgb(var(--accent-emerald-rgb)/0.2)] to-[rgb(var(--accent-emerald-rgb)/0.05)]',
              highlight: null,
            },
            {
              quote: t('landing.testimonial4Quote'),
              author: t('landing.testimonial4Author'),
              role: t('landing.testimonial4Role'),
              clinic: t('landing.testimonial4Clinic'),
              rating: 5,
              gradient: 'from-[rgb(var(--accent-rose-rgb)/0.2)] to-[rgb(var(--accent-rose-rgb)/0.05)]',
              highlight: null,
            }
          ].map((testimonial, i) => (
            <div
              key={i}
              className={`scroll-reveal scroll-reveal-delay-${i + 1} relative bg-background rounded-xl p-6 border border-border/50 border-l-4 border-l-primary/40 glass-panel glow-card`}
            >
              <span className="absolute top-2 right-4 text-7xl leading-none font-serif text-primary/[0.05] select-none" aria-hidden="true">&ldquo;</span>
              {testimonial.highlight && (
                <Badge variant="secondary" className="mb-3 text-xs">
                  <Zap className="w-3 h-3 mr-1" aria-hidden="true" />
                  {testimonial.highlight}
                </Badge>
              )}
              <div className="flex gap-1 mb-3" aria-label={t('landing.starRating', { rating: testimonial.rating})}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    aria-hidden="true"
                    className={`w-4 h-4 ${j < testimonial.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`}
                  />
                ))}
              </div>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-primary font-semibold text-sm shrink-0`}>
                  {getInitials(testimonial.author)}
                </div>
                <div>
                  <p className="font-medium text-sm">{testimonial.author}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  <p className="text-xs text-muted-foreground/70">{testimonial.clinic}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
