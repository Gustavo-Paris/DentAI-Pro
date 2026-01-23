import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Atualizando...' : 'Atualizar senha'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
