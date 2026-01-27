import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/schemas/auth';
import { PasswordRequirements } from '@/components/PasswordRequirements';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export default function ResetPassword() {
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
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      }
    };

    // Listen for auth state changes (recovery link click)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionReady(true);
      }
    });

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: data.password });

    if (error) {
      toast.error('Erro ao atualizar senha', {
        description: error.message,
      });
    } else {
      setSuccess(true);
      toast.success('Senha atualizada com sucesso!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }

    setLoading(false);
  };

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-sm text-center">
          <Link to="/" className="text-lg sm:text-xl font-semibold tracking-tight">
            ResinMatch AI
          </Link>
          <h1 className="text-xl sm:text-2xl font-semibold mt-6 sm:mt-8 mb-2">
            Link inválido ou expirado
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            O link de recuperação pode ter expirado. Solicite um novo link.
          </p>
          <Link to="/forgot-password">
            <Button className="w-full">Solicitar novo link</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="text-lg sm:text-xl font-semibold tracking-tight">
            ResinMatch AI
          </Link>
          <h1 className="text-xl sm:text-2xl font-semibold mt-6 sm:mt-8 mb-2">
            {success ? 'Senha atualizada!' : 'Nova senha'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {success 
              ? 'Você será redirecionado automaticamente'
              : 'Digite sua nova senha'
            }
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Redirecionando para o dashboard...
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova senha</FormLabel>
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
                    <FormLabel>Confirmar nova senha</FormLabel>
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Atualizando...' : 'Atualizar senha'}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
