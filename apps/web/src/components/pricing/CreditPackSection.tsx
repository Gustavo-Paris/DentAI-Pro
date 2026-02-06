import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription, formatPrice } from '@/hooks/useSubscription';

export function CreditPackSection() {
  const {
    creditPacks,
    purchasePack,
    isPurchasingPack,
    isActive,
  } = useSubscription();

  if (!isActive || creditPacks.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-display">Comprar Créditos Extras</CardTitle>
        <CardDescription>
          Precisa de mais créditos? Compre pacotes avulsos sem alterar seu plano.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {creditPacks.map((pack) => (
            <div
              key={pack.id}
              className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center"
            >
              <span className="text-2xl font-bold font-display">{pack.credits}</span>
              <span className="text-sm text-muted-foreground">créditos</span>
              <span className="text-lg font-semibold">{formatPrice(pack.price)}</span>
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-1"
                disabled={isPurchasingPack}
                onClick={() => purchasePack(pack.id)}
              >
                {isPurchasingPack ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Comprar
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
