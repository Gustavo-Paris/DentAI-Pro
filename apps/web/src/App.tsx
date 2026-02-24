import { Suspense, lazy, useCallback, Component, type ReactNode, type ErrorInfo } from 'react';
import * as Sentry from '@sentry/react';
import { AlertCircle } from 'lucide-react';
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
import i18n from '@/lib/i18n';

// Retry lazy imports on chunk loading failure (stale deploy).
// After a new Vercel deploy, old chunk hashes become 404.
// This auto-reloads the page once to fetch fresh assets.
function lazyRetry<T extends { default: React.ComponentType<unknown> }>(
  importFn: () => Promise<T>,
): React.LazyExoticComponent<T['default']> {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      const isChunkError =
        error instanceof TypeError &&
        error.message.includes('dynamically imported module');
      if (isChunkError) {
        const key = 'chunk-retry-' + window.location.pathname;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          window.location.reload();
          return new Promise(() => {}); // never resolves — reload takes over
        }
        sessionStorage.removeItem(key);
      }
      throw error;
    }
  });
}

// Eager load static legal pages (small, no PageShell dependency)
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";

// Lazy load auth pages (import PageShell primitives)
const Login = lazyRetry(() => import("@/pages/Login"));
const Register = lazyRetry(() => import("@/pages/Register"));
const ForgotPassword = lazyRetry(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazyRetry(() => import("@/pages/ResetPassword"));
const NotFound = lazyRetry(() => import("@/pages/NotFound"));

// Lazy load public pages
const Landing = lazyRetry(() => import("@/pages/Landing"));
const SharedEvaluation = lazyRetry(() => import("@/pages/SharedEvaluation"));

// Lazy load protected pages
const Dashboard = lazyRetry(() => import("@/pages/Dashboard"));
const NewCase = lazyRetry(() => import("@/pages/NewCase"));
const Inventory = lazyRetry(() => import("@/pages/Inventory"));
const Result = lazyRetry(() => import("@/pages/Result"));
const Evaluations = lazyRetry(() => import("@/pages/Evaluations"));
const EvaluationDetails = lazyRetry(() => import("@/pages/EvaluationDetails"));
const Patients = lazyRetry(() => import("@/pages/Patients"));
const PatientProfile = lazyRetry(() => import("@/pages/PatientProfile"));
const Profile = lazyRetry(() => import("@/pages/Profile"));
const Pricing = lazyRetry(() => import("@/pages/Pricing"));
const GroupResult = lazyRetry(() => import("@/pages/GroupResult"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry 4xx errors (client errors)
        if (error instanceof Error && 'status' in error && (error as { status: number }).status < 500) {
          return false;
        }
        return failureCount < 2; // 2 retries for server/network errors
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      staleTime: QUERY_STALE_TIMES.SHORT,
    },
    mutations: {
      retry: 0, // Never auto-retry mutations (payments, AI calls, etc.)
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
      <h2 className="text-lg font-semibold mb-1">{i18n.t('errors.somethingWentWrong')}</h2>
      <p className="text-sm text-muted-foreground mb-4">{i18n.t('errors.unexpectedPageError')}</p>
      <a
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {i18n.t('errors.backToDashboard')}
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
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-background focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-primary"
        >
          {i18n.t('components.layout.skipToContent', { defaultValue: 'Pular para o conteúdo principal' })}
        </a>
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
