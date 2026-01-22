import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error('Erro ao entrar', {
        description: 'Email ou senha incorretos.',
      });
    } else {
      toast.success('Bem-vindo de volta!');
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="text-lg sm:text-xl font-semibold tracking-tight">
            ResinMatch AI
          </Link>
          <h1 className="text-xl sm:text-2xl font-semibold mt-6 sm:mt-8 mb-2">Entrar</h1>
          <p className="text-sm text-muted-foreground">
            Acesse sua conta para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Não tem uma conta?{' '}
          <Link to="/register" className="text-foreground underline underline-offset-4">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
