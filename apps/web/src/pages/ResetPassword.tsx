import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getSession, onAuthStateChange, updateUserPassword } from '@/data/auth';
import { Button, PasswordInput } from '@parisgroup-ai/pageshell/primitives';
import { toast } from 'sonner';
import { CheckCircle, Loader2 } from 'lucide-react';
import { getResetPasswordSchema, type ResetPasswordFormData } from '@/lib/schemas/auth';
import { PasswordRequirements } from '@/components/PasswordRequirements';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { IconCircle } from '@/components/shared/IconCircle';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@parisgroup-ai/pageshell/interactions';

const REDIRECT_DELAY_MS = 2_000;

export default function ResetPassword() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.resetPassword'));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const navigate = useNavigate();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(getResetPasswordSchema()),
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
      setSessionLoading(false);
    };

    // Listen for auth state changes (recovery link click)
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionReady(true);
        setSessionLoading(false);
      }
    });

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate('/dashboard'), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [success, navigate]);

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
    }

    setLoading(false);
  };

  if (sessionLoading) {
    return (
      <AuthLayout title={t('auth.resetPasswordTitle')} subtitle="">
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AuthLayout>
    );
  }

  if (!sessionReady) {
    return (
      <AuthLayout
        title={t('auth.invalidLink')}
        subtitle={t('auth.invalidLinkDescription')}
      >
        <Link to="/forgot-password">
          <Button className="w-full btn-glow">{t('auth.requestNewLink')}</Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={success ? t('auth.resetPasswordSuccess') : t('auth.resetPasswordTitle')}
      subtitle={success
        ? t('auth.resetPasswordRedirect')
        : t('auth.resetPasswordSubtitle')
      }
    >
      {success ? (
        <div className="flex flex-col items-center gap-4 animate-[scale-in_0.6s_ease-out_both]" role="status" aria-live="polite">
          <IconCircle>
            <CheckCircle className="w-8 h-8 text-primary" aria-hidden="true" />
          </IconCircle>
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
                      <PasswordInput
                        placeholder="••••••••••••"
                        autoComplete="new-password"
                        aria-describedby="password-requirements"
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
                      <PasswordInput
                        placeholder="••••••••••••"
                        autoComplete="new-password"
                        aria-required="true"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full btn-glow" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('auth.updating')}
                  </>
                ) : (
                  t('auth.updatePassword')
                )}
              </Button>
            </form>
          </Form>
        </div>
      )}
    </AuthLayout>
  );
}
