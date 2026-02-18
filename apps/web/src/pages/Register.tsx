import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Checkbox } from '@parisgroup-ai/pageshell/primitives';
import { toast } from 'sonner';
import { registerSchema, type RegisterFormData } from '@/lib/schemas/auth';
import { PasswordRequirements } from '@/components/PasswordRequirements';
import { BRAND_NAME } from '@/lib/branding';
import { GoogleIcon } from '@/components/GoogleIcon';
import { Mail } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export default function Register() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      cro: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptedTerms: false,
    },
  });

  const password = form.watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);

    const { error } = await signUp(data.email, data.password, data.fullName, data.cro || '');

    if (error) {
      toast.error(t('auth.createAccountError'), {
        description: error.message,
      });
    } else {
      setEmailSent(true);
    }

    setLoading(false);
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(t('auth.googleRegisterError'), {
        description: error.message,
      });
      setGoogleLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-sm text-center">
          <Link to="/" className="font-display tracking-[0.2em] text-gradient-gold text-lg sm:text-xl font-semibold">
            {BRAND_NAME}
          </Link>
          <div className="mt-6 sm:mt-8 animate-[scale-in_0.6s_ease-out_both]">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold font-display mb-2">{t('auth.verifyEmail')}</h1>
            <p className="text-sm text-muted-foreground mb-6">
              {t('auth.verifyEmailSent')}{' '}
              <span className="font-medium text-foreground">{form.getValues('email')}</span>.
              {t('auth.verifyEmailClickLink')}
            </p>
            <Link to="/login">
              <Button className="w-full btn-glow-gold">{t('common.goToLogin')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
    >
      <div className="animate-[fade-in-up_0.6s_ease-out_0.4s_both]">
        <Button
          variant="outline"
          className="w-full mb-4 shadow-sm hover:shadow-md transition-all duration-200"
          onClick={handleGoogleRegister}
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
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.fullName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('auth.fullNamePlaceholder')}
                      autoComplete="name"
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
              name="cro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.croLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="CRO-SP 12345"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.professionalEmail')}</FormLabel>
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
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      aria-required="true"
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
                  <FormLabel>{t('auth.confirmPassword')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
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

            <FormField
              control={form.control}
              name="acceptedTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm leading-relaxed cursor-pointer font-normal">
                      {t('auth.acceptTerms')}{' '}
                      <Link to="/terms" className="underline underline-offset-4 hover:text-foreground" target="_blank">
                        {t('auth.termsOfUse')}
                      </Link>
                      {' '}{t('auth.and')}{' '}
                      <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground" target="_blank">
                        {t('auth.privacyPolicy')}
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full btn-glow-gold" disabled={loading}>
              {loading ? t('auth.creatingAccount') : t('auth.signUp')}
            </Button>
          </form>
        </Form>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="text-foreground underline underline-offset-4">
          {t('auth.login')}
        </Link>
      </p>
    </AuthLayout>
  );
}
