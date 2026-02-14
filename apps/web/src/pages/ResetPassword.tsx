import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { getSession, onAuthStateChange, updateUserPassword } from '@/data/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/schemas/auth';
import { PasswordRequirements } from '@/components/PasswordRequirements';
import { BRAND_NAME } from '@/lib/branding';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = form.watch('password');

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await getSession();
      if (session) {
        setSessionReady(true);
      }
    };

    // Listen for auth state changes (recovery link click)
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionReady(true);
      }
    });

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);

    const { error } = await updateUserPassword(data.password);

    if (error) {
      toast.error(t('auth.updatePasswordError'), {
        description: error.message,
      });
    } else {
      setSuccess(true);
      toast.success(t('auth.updatePasswordSuccess'));
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }

    setLoading(false);
  };

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-background flex" role="main">
        {/* Brand panel — desktop only */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden grain-overlay bg-background" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_hsl(235_56%_58%/0.08),_transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(235_60%_68%/0.05),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(235_56%_58%/0.03),_transparent_40%)]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative flex flex-col justify-center px-12 xl:px-16">
            <span className="text-2xl font-display tracking-[0.2em] text-gradient-gold mb-4">{BRAND_NAME}</span>
            <h2 className="text-3xl sm:text-4xl font-semibold font-display tracking-tight text-foreground/90 mb-3">
              {t('landing.brandSlogan')}
            </h2>
            <p className="text-muted-foreground max-w-md">
              {t('landing.brandDescriptionAlt')}
            </p>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
          <div className="w-full max-w-sm text-center">
            <Link to="/" className="text-lg sm:text-xl font-display tracking-[0.2em] text-gradient-gold">
              {BRAND_NAME}
            </Link>
            <h1 className="text-xl sm:text-2xl font-semibold font-display mt-6 sm:mt-8 mb-2">
              {t('auth.invalidLink')}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {t('auth.invalidLinkDescription')}
            </p>
            <Link to="/forgot-password">
              <Button className="w-full btn-glow-gold">{t('auth.requestNewLink')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex" role="main">
      {/* Brand panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden grain-overlay bg-background" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_hsl(235_56%_58%/0.08),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(235_60%_68%/0.05),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(235_56%_58%/0.03),_transparent_40%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex flex-col justify-center px-12 xl:px-16">
          <span className="text-2xl font-display tracking-[0.2em] text-gradient-gold mb-4">{BRAND_NAME}</span>
          <h2 className="text-3xl sm:text-4xl font-semibold font-display tracking-tight text-foreground/90 mb-3">
            {t('landing.brandSlogan')}
          </h2>
          <p className="text-muted-foreground max-w-md">
            {t('landing.brandDescriptionAlt')}
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6 sm:mb-8">
            <Link to="/" className="text-lg sm:text-xl font-display tracking-[0.2em] text-gradient-gold animate-[fade-in-up_0.6s_ease-out_0.2s_both]">
              {BRAND_NAME}
            </Link>
            <h1 className="text-xl sm:text-2xl font-semibold font-display mt-6 sm:mt-8 mb-2 animate-[fade-in-up_0.6s_ease-out_0.3s_both]">
              {success ? t('auth.resetPasswordSuccess') : t('auth.resetPasswordTitle')}
            </h1>
            <p className="text-sm text-muted-foreground animate-[fade-in-up_0.6s_ease-out_0.4s_both]">
              {success
                ? t('auth.resetPasswordRedirect')
                : t('auth.resetPasswordSubtitle')
              }
            </p>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-4 animate-[scale-in_0.6s_ease-out_both]">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {t('auth.redirectingToDashboard')}
              </p>
            </div>
          ) : (
            <div className="animate-[fade-in-up_0.6s_ease-out_0.5s_both]">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.newPassword')}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••••••"
                            {...field}
                          />
                        </FormControl>
                        <PasswordRequirements password={password} className="mt-2" />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.confirmNewPassword')}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full btn-glow-gold" disabled={loading}>
                    {loading ? t('auth.updating') : t('auth.updatePassword')}
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
