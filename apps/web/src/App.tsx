import { Suspense, lazy, useCallback, Component, type ReactNode, type ErrorInfo } from 'react';
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
import CookieConsent from "@/components/CookieConsent";
import PostHogProvider from "@/components/PostHogProvider";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { evaluations } from "@/data";


// Eager load auth pages (needed immediately)
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/NotFound";

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
    },
  },
});

// Route-level error fallback — lighter than the root ErrorBoundary
function RouteErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-12 h-12 mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
        <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold mb-1">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-4">An unexpected error occurred on this page.</p>
      <a
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Go back to Dashboard
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
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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

            <Route path="*" element={<NotFound />} />
          </Routes>
          <ConnectedGlobalSearch />
          <KeyboardShortcuts />
          <CookieConsent />
          </PostHogProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
