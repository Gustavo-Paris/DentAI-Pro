import { Suspense, lazy, useCallback, Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertCircle } from 'lucide-react';
import { Toaster } from "@/components/ui/toaster";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PageShellI18nProvider, PT_BR_MESSAGES } from '@parisgroup-ai/pageshell/core';
import CookieConsent from "@/components/CookieConsent";
import PostHogProvider from "@/components/PostHogProvider";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { evaluations } from "@/data";
import { QUERY_STALE_TIMES } from "@/lib/constants";

// Eager load static legal pages (small, no PageShell dependency)
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";

// Lazy load auth pages (import PageShell primitives)
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Lazy load public pages
const Landing = lazy(() => import("@/pages/Landing"));
const SharedEvaluation = lazy(() => import("@/pages/SharedEvaluation"));

// Lazy load protected pages
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const NewCase = lazy(() => import("@/pages/NewCase"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Result = lazy(() => import("@/pages/Result"));
const Evaluations = lazy(() => import("@/pages/Evaluations"));
const EvaluationDetails = lazy(() => import("@/pages/EvaluationDetails"));
const Patients = lazy(() => import("@/pages/Patients"));
const PatientProfile = lazy(() => import("@/pages/PatientProfile"));
const Profile = lazy(() => import("@/pages/Profile"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const GroupResult = lazy(() => import("@/pages/GroupResult"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: QUERY_STALE_TIMES.SHORT,
    },
  },
});

// Route-level error fallback — lighter than the root ErrorBoundary
function RouteErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-12 h-12 mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold mb-1">Algo deu errado</h2>
      <p className="text-sm text-muted-foreground mb-4">Ocorreu um erro inesperado nesta página.</p>
      <a
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Voltar ao Dashboard
      </a>
    </div>
  );
}

// Route-level error boundary — scoped to a single route, not the entire app
class RouteErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RouteErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) return <RouteErrorFallback />;
    return this.props.children;
  }
}

// Loading fallback for lazy-loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <span className="text-xl font-semibold tracking-[0.2em] font-display text-gradient-gold animate-pulse">
        ToSmile.ai
      </span>
      <div className="w-48">
        <Skeleton className="h-1 w-full rounded-full" />
      </div>
    </div>
  </div>
);

function ConnectedGlobalSearch() {
  const { user } = useAuth();
  const fetchEvaluations = useCallback(
    () => (user ? evaluations.searchRecent(user.id) : Promise.resolve([])),
    [user],
  );
  return <GlobalSearch fetchEvaluations={fetchEvaluations} />;
}

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
    <PageShellI18nProvider locale="pt-BR" bundle={{ locale: 'pt-BR', messages: PT_BR_MESSAGES, currency: 'BRL' }}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineBanner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
          <PostHogProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Suspense fallback={<PageLoader />}><Landing /></Suspense>} />
            <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
            <Route path="/register" element={<Suspense fallback={<PageLoader />}><Register /></Suspense>} />
            <Route path="/forgot-password" element={<Suspense fallback={<PageLoader />}><ForgotPassword /></Suspense>} />
            <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/shared/:token" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><SharedEvaluation /></Suspense></ErrorBoundary>} />

            {/* Redirect legacy /cases route */}
            <Route path="/cases" element={<Navigate to="/evaluations" replace />} />

            {/* Protected routes WITH persistent nav layout */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Dashboard /></Suspense></ErrorBoundary>} />
              <Route path="/evaluations" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Evaluations /></Suspense></ErrorBoundary>} />
              <Route path="/evaluation/:evaluationId" element={<RouteErrorBoundary><Suspense fallback={<PageLoader />}><EvaluationDetails /></Suspense></RouteErrorBoundary>} />
              <Route path="/result/group/:sessionId/:fingerprint" element={<RouteErrorBoundary><Suspense fallback={<PageLoader />}><GroupResult /></Suspense></RouteErrorBoundary>} />
              <Route path="/result/:id" element={<RouteErrorBoundary><Suspense fallback={<PageLoader />}><Result /></Suspense></RouteErrorBoundary>} />
              <Route path="/inventory" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Inventory /></Suspense></ErrorBoundary>} />
              <Route path="/patients" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Patients /></Suspense></ErrorBoundary>} />
              <Route path="/patient/:patientId" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><PatientProfile /></Suspense></ErrorBoundary>} />
              <Route path="/profile" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Profile /></Suspense></ErrorBoundary>} />
              <Route path="/pricing" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Pricing /></Suspense></ErrorBoundary>} />
              <Route path="/new-case" element={<RouteErrorBoundary><Suspense fallback={<PageLoader />}><NewCase /></Suspense></RouteErrorBoundary>} />
            </Route>

            <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
          </Routes>
          <ConnectedGlobalSearch />
          <KeyboardShortcuts />
          <CookieConsent />
          </PostHogProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </PageShellI18nProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
