import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ComposePage } from './pages/ComposePage';
import { OutboxPage } from './pages/OutboxPage';
import { SentPage } from './pages/SentPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LoadingSpinner } from './components/LoadingSpinner';

const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Outbox Mail Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/compose" element={<ComposePage />} />
          <Route path="/outbox" element={<OutboxPage />} />
          <Route path="/sent" element={<SentPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
