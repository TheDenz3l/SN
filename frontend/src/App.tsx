import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

// Import stores
import { useAuthStore } from './stores/authStore';

// Import components
import ErrorBoundary from './ErrorBoundary';

// Import pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import SetupPage from './pages/SetupPage';
import ProfilePage from './pages/ProfilePage';
import NotesHistoryPage from './pages/NotesHistory';
import TestPage from './TestPage';

// Import auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Import layouts
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';

// Re-enabling NoteGenerationPage without WritingStyleConfidence
import NoteGenerationPage from './pages/NoteGenerationPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

// Protected Route Component with enhanced error handling and loading states
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    const { isAuthenticated, isLoading } = useAuthStore();

    // Show loading spinner while auth is being determined
    if (isLoading) {
      return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    console.error('❌ ProtectedRoute error:', error);
    return <Navigate to="/login" replace />;
  }
};

// Public Route Component with enhanced error handling and loading states
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    const { isAuthenticated, isLoading } = useAuthStore();

    // Show loading spinner while auth is being determined
    if (isLoading) {
      return <LoadingSpinner />;
    }

    if (isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    console.error('❌ PublicRoute error:', error);
    return <>{children}</>;
  }
};

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading SwiftNotes...</p>
    </div>
  </div>
);

function App() {
  console.log('🚀 App component is rendering');

  // TEMPORARY: Disable AuthStateManager to fix performance issues
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize().catch(error => {
      console.error('❌ Auth initialization failed:', error);
    });
  }, [initialize]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/test" element={<TestPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={
              <PublicRoute>
                <AuthLayout>
                  <LoginPage />
                </AuthLayout>
              </PublicRoute>
            } />

            <Route path="/register" element={
              <PublicRoute>
                <AuthLayout>
                  <RegisterPage />
                </AuthLayout>
              </PublicRoute>
            } />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/setup" element={
              <ProtectedRoute>
                <Layout>
                  <SetupPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/generate" element={
              <ProtectedRoute>
                <Layout>
                  <NoteGenerationPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/notes" element={
              <ProtectedRoute>
                <Layout>
                  <NotesHistoryPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            } />



                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>

          {/* Global Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Router>

        {/* React Query Devtools (only in development) */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
