import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Gift, Users, Zap, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { useReferral } from '@/hooks/domain/useReferral';
import { toast } from 'sonner';

export function ReferralCard() {
  const { t } = useTranslation();
  const { code, stats, isLoading, shareUrl, copyToClipboard } = useReferral();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const whatsAppMessage = encodeURIComponent(
    t('components.referral.whatsAppMessage', { code, url: shareUrl }),
  );
  const whatsAppUrl = `https://wa.me/?text=${whatsAppMessage}`;

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast.success(t('referral.copied'));
  };

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-display">{t('referral.title')}</CardTitle>
            <CardDescription>{t('referral.description')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral code display */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-background border border-border rounded-lg px-4 py-3 font-mono text-lg tracking-wider text-center select-all">
            {code}
          </div>
          <Button variant="outline" size="icon" onClick={copyToClipboard} title={t('referral.copyCode')}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">{stats.totalReferrals}</p>
              <p className="text-xs text-muted-foreground">{t('referral.stats.totalReferrals')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">{stats.totalCreditsEarned}</p>
              <p className="text-xs text-muted-foreground">{t('referral.stats.creditsEarned')}</p>
            </div>
          </div>
        </div>

        {/* Reward info */}
        <p className="text-sm text-muted-foreground text-center">
          {t('referral.reward')}
        </p>

        {/* Share buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            asChild
          >
            <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              {t('referral.shareWhatsApp')}
            </a>
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
            <LinkIcon className="h-4 w-4 mr-2" />
            {t('referral.copyLink')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
