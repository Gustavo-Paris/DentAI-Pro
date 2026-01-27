import { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console for development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Report to Sentry in production
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              
              <h2 className="text-xl font-semibold mb-2">Algo deu errado</h2>
              
              <p className="text-muted-foreground mb-6">
                Ocorreu um erro inesperado. Por favor, recarregue a página ou volte ao início.
              </p>
              
              {import.meta.env.DEV && this.state.error && (
                <div className="mb-6 p-3 rounded-md bg-muted text-left">
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleReload} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Recarregar Página
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                  <Home className="w-4 h-4" />
                  Ir para Início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
