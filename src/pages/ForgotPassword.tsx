import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';
import { BRAND_NAME } from '@/lib/branding';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error('Erro ao enviar email', {
        description: error.message,
      });
    } else {
      setSent(true);
      toast.success('Email enviado!', {
        description: 'Verifique sua caixa de entrada.',
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="text-lg sm:text-xl font-semibold tracking-tight">
            {BRAND_NAME}
          </Link>
          <h1 className="text-xl sm:text-2xl font-semibold mt-6 sm:mt-8 mb-2">
            Recuperar senha
          </h1>
          <p className="text-sm text-muted-foreground">
            {sent 
              ? 'Verifique seu email para redefinir sua senha'
              : 'Digite seu email para receber o link de recuperação'
            }
          </p>
        </div>

        {sent ? (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Enviamos um link de recuperação para <strong>{email}</strong>. 
              Clique no link do email para criar uma nova senha.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setSent(false)}
            >
              Enviar novamente
            </Button>
          </div>
        ) : (
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </Button>
          </form>
        )}

        <Link 
          to="/login" 
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-6 hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
