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
import { AuthLayout } from '@/components/auth/AuthLayout';
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
      <AuthLayout
        title={t('auth.invalidLink')}
        subtitle={t('auth.invalidLinkDescription')}
      >
        <Link to="/forgot-password">
          <Button className="w-full btn-glow-gold">{t('auth.requestNewLink')}</Button>
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
    </AuthLayout>
  );
}
