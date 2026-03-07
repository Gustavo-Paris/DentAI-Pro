import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingStats } from '@/components/landing/LandingStats';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks';
import { LandingTestimonials } from '@/components/landing/LandingTestimonials';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { LandingPricing } from '@/components/landing/LandingPricing';
import { LandingCTA } from '@/components/landing/LandingCTA';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function Landing() {
  useDocumentTitle('');
  const [searchParams] = useSearchParams();

  // Capture referral code from URL and store in localStorage
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && /^[A-Z0-9-]{4,20}$/i.test(ref)) {
      localStorage.setItem('referral_code', JSON.stringify({ code: ref, ts: Date.now() }));
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main id="main-content">
        <LandingHero />
        <LandingStats />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingTestimonials />
        <LandingFAQ />
        <LandingPricing />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
