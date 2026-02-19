import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@parisgroup-ai/pageshell/primitives';
import { toast } from 'sonner';
import { loginSchema, type LoginFormData } from '@/lib/schemas/auth';
import { GoogleIcon } from '@/components/GoogleIcon';
import { AuthLayout } from '@/components/auth/AuthLayout';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export default function Login() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string })?.returnTo;

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);

    const { error } = await signIn(data.email, data.password);

    if (error) {
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        toast.error(t('auth.verifyEmail'), {
          description: t('auth.verifyEmailDescription'),
        });
      } else {
        toast.error(t('auth.loginError'), {
          description: t('auth.loginErrorDescription'),
        });
      }
    } else {
      toast.success(t('auth.welcomeBack'));
      navigate(returnTo || '/dashboard');
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    // Persist returnTo across OAuth redirect (location state is lost during redirect)
    if (returnTo) {
      sessionStorage.setItem('returnTo', returnTo);
    }
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(t('auth.googleLoginError'), {
        description: error.message,
      });
      sessionStorage.removeItem('returnTo');
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
    >
      <div className="animate-[fade-in-up_0.6s_ease-out_0.4s_both]">
        <Button
          variant="outline"
          className="w-full mb-4 shadow-sm hover:shadow-md transition-all duration-200"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          type="button"
        >
          <GoogleIcon className="w-4 h-4 mr-2" />
          {googleLoading ? t('auth.connecting') : t('auth.continueWithGoogle')}
        </Button>
      </div>

      <div className="relative mb-4 animate-[fade-in-up_0.6s_ease-out_0.45s_both]">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t('common.or')}</span>
        </div>
      </div>

      <div className="animate-[fade-in-up_0.6s_ease-out_0.5s_both]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.email')}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      autoComplete="email"
                      aria-required="true"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.password')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      aria-required="true"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                {t('auth.forgotPasswordLink')}
              </Link>
            </div>

            <Button type="submit" className="w-full btn-glow-gold" disabled={loading}>
              {loading ? t('auth.loggingIn') : t('auth.login')}
            </Button>
          </form>
        </Form>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="text-foreground underline underline-offset-4">
          {t('auth.signUp')}
        </Link>
      </p>
    </AuthLayout>
  );
}
