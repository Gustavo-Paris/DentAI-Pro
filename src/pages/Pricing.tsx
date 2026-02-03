import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PricingSection } from '@/components/pricing/PricingSection';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Pricing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSubscription } = useSubscription();

  // Handle redirect from Stripe
  useEffect(() => {
    const status = searchParams.get('subscription');

    if (status === 'success') {
      toast.success('Assinatura ativada com sucesso!');
      // Sync subscription from Stripe with retry (bypasses webhook timing issues)
      const syncWithRetry = async (attempts = 3, delay = 2000) => {
        for (let i = 0; i < attempts; i++) {
          try {
            const { data } = await supabase.functions.invoke('sync-subscription', { body: {} });
            if (data?.synced) {
              refreshSubscription();
              return;
            }
          } catch (e) {
            console.error(`Sync attempt ${i + 1} failed:`, e);
          }
          if (i < attempts - 1) await new Promise(r => setTimeout(r, delay));
        }
        refreshSubscription();
      };
      syncWithRetry();
      navigate('/pricing', { replace: true });
    } else if (status === 'canceled') {
      toast.info('Checkout cancelado');
      navigate('/pricing', { replace: true });
    }
  }, [searchParams, navigate, refreshSubscription]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-lg sm:text-xl font-semibold tracking-tight flex-1">Planos</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <PricingSection />
      </main>
    </div>
  );
}
