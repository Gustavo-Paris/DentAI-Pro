import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPasswordForEmail } from '@/data/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';
import { BRAND_NAME } from '@/lib/branding';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await resetPasswordForEmail(email, `${window.location.origin}/reset-password`);

    if (error) {
      toast.error(t('auth.sendError'), {
        description: error.message,
      });
    } else {
      setSent(true);
      toast.success(t('auth.emailSent'), {
        description: t('auth.emailSentDescription'),
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex" role="main">
      {/* Brand panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden grain-overlay bg-background" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_hsl(235_56%_58%/0.08),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(235_60%_68%/0.05),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(235_56%_58%/0.03),_transparent_40%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex flex-col justify-center px-12 xl:px-16">
          <span className="font-display tracking-[0.2em] text-gradient-gold text-2xl font-semibold mb-6 animate-[fade-in-up_0.6s_ease-out_0.2s_both]">{BRAND_NAME}</span>
          <h2 className="text-3xl xl:text-4xl font-display font-semibold tracking-tight mb-3 animate-[fade-in-up_0.6s_ease-out_0.3s_both]">{t('landing.brandSlogan')}</h2>
          <p className="text-muted-foreground text-lg animate-[fade-in-up_0.6s_ease-out_0.4s_both]">{t('landing.brandDescription')}</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6 sm:mb-8">
            <Link to="/" className="font-display tracking-[0.2em] text-gradient-gold text-lg sm:text-xl font-semibold lg:hidden animate-[fade-in-up_0.6s_ease-out_0.2s_both]">
              {BRAND_NAME}
            </Link>
            <h1 className="text-xl sm:text-2xl font-semibold font-display mt-6 sm:mt-8 mb-2 animate-[fade-in-up_0.6s_ease-out_0.3s_both]">
              {t('auth.forgotPasswordTitle')}
            </h1>
            <p className="text-sm text-muted-foreground animate-[fade-in-up_0.6s_ease-out_0.3s_both]">
              {sent
                ? t('auth.forgotPasswordSubtitleSent')
                : t('auth.forgotPasswordSubtitle')
              }
            </p>
          </div>

          {sent ? (
            <div className="space-y-6 animate-[scale-in_0.6s_ease-out_both]">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.verifyEmailSent')} <strong>{email}</strong>.
                {t('auth.verifyEmailClickLink')}
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSent(false)}
              >
                {t('auth.sendAgain')}
              </Button>
            </div>
          ) : (
            <div className="animate-[fade-in-up_0.6s_ease-out_0.5s_both]">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-required="true"
                    autoComplete="email"
                  />
                </div>

                <Button type="submit" className="w-full btn-glow-gold" disabled={loading}>
                  {loading ? t('auth.sending') : t('auth.sendRecoveryLink')}
                </Button>
              </form>
            </div>
          )}

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-6 hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
