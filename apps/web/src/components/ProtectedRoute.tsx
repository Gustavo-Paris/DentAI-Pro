import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-label="Carregando">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ returnTo: location.pathname + location.search }} replace />;
  }

  return <>{children}</>;
}
