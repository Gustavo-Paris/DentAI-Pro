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
import { Skeleton } from "@/components/ui/skeleton";

// Eager load auth pages (needed immediately)
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/NotFound";

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

const queryClient = new QueryClient();

// Loading fallback for lazy-loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-full max-w-4xl mx-4 space-y-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-[400px] w-full" />
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
        <BrowserRouter>
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
            
            {/* Redirect legacy /cases route */}
            <Route path="/cases" element={<Navigate to="/evaluations" replace />} />

            {/* Protected routes - lazy loaded */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <Dashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/new-case"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <NewCase />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <Inventory />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/evaluations"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <Evaluations />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/evaluation/:evaluationId"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <EvaluationDetails />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/result/:id"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <Result />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <Profile />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <Patients />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/:patientId"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <PatientProfile />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pricing"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <Pricing />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <GlobalSearch />
          <CookieConsent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
