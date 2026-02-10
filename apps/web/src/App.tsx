import { Suspense, lazy } from 'react';
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
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/components/AppLayout";

// Eager load auth pages (needed immediately)
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/NotFound";

// Lazy load public pages
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Loading fallback for lazy-loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <span className="text-xl font-semibold tracking-[0.2em] font-display text-gradient-gold animate-pulse">
        AURIA
      </span>
      <div className="w-48">
        <Skeleton className="h-1 w-full rounded-full" />
      </div>
    </div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineBanner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
          >
            Pular para conteúdo
          </a>
          <AuthProvider>
          <Routes>
            {/* Public routes - eagerly loaded */}
            <Route path="/" element={<Landing />} />
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
              <Route path="/evaluation/:evaluationId" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><EvaluationDetails /></Suspense></ErrorBoundary>} />
              <Route path="/result/:id" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Result /></Suspense></ErrorBoundary>} />
              <Route path="/inventory" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Inventory /></Suspense></ErrorBoundary>} />
              <Route path="/patients" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Patients /></Suspense></ErrorBoundary>} />
              <Route path="/patient/:patientId" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><PatientProfile /></Suspense></ErrorBoundary>} />
              <Route path="/profile" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Profile /></Suspense></ErrorBoundary>} />
              <Route path="/pricing" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Pricing /></Suspense></ErrorBoundary>} />
              <Route path="/new-case" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><NewCase /></Suspense></ErrorBoundary>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          <GlobalSearch />
          <KeyboardShortcuts />
          <CookieConsent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
