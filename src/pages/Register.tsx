import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [cro, setCro] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      toast.error('Você precisa aceitar os Termos de Uso e Política de Privacidade');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, fullName, cro);
    
    if (error) {
      toast.error('Erro ao criar conta', {
        description: error.message,
      });
    } else {
      toast.success('Conta criada com sucesso!');
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
          <h1 className="text-xl sm:text-2xl font-semibold mt-6 sm:mt-8 mb-2">Criar conta</h1>
          <p className="text-sm text-muted-foreground">
            Preencha os dados para começar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Dr. João Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cro">CRO (opcional)</Label>
            <Input
              id="cro"
              type="text"
              placeholder="CRO-SP 12345"
              value={cro}
              onChange={(e) => setCro(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email profissional</Label>
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox 
              id="terms" 
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
            />
            <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
              Li e aceito os{' '}
              <Link to="/terms" className="underline underline-offset-4 hover:text-foreground" target="_blank">
                Termos de Uso
              </Link>
              {' '}e a{' '}
              <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground" target="_blank">
                Política de Privacidade
              </Link>
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !acceptedTerms}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-foreground underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
