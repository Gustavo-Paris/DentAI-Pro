import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { resetPasswordForEmail } from '@/data/auth';
import { Button, Input, Label } from '@parisgroup-ai/pageshell/primitives';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { IconCircle } from '@/components/shared/IconCircle';

export default function ForgotPassword() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.forgotPassword'));
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
    <AuthLayout
      title={t('auth.forgotPasswordTitle')}
      subtitle={sent
        ? t('auth.forgotPasswordSubtitleSent')
        : t('auth.forgotPasswordSubtitle')
      }
    >
      {sent ? (
        <div className="space-y-6 animate-[scale-in_0.6s_ease-out_both]">
          <div className="flex items-center justify-center">
            <IconCircle>
              <Mail className="w-8 h-8 text-primary" aria-hidden="true" />
            </IconCircle>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {t('auth.verifyEmailSent')} <strong>{email}</strong>.{' '}
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
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
                autoComplete="email"
              />
            </div>

            <Button type="submit" className="w-full btn-glow" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('auth.sending')}
                </>
              ) : (
                t('auth.sendRecoveryLink')
              )}
            </Button>
          </form>
        </div>
      )}

      <Link
        to="/login"
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-6 hover:text-foreground transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {t('common.backToLogin')}
      </Link>
    </AuthLayout>
  );
}
