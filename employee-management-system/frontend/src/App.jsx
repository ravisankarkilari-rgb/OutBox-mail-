import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { EmployeeDetailPage } from './pages/EmployeeDetailPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { PerformancePage } from './pages/PerformancePage';
import { ReportsPage } from './pages/ReportsPage';
import { EmployeePortalPage } from './pages/EmployeePortalPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LoadingSpinner } from './components/LoadingSpinner';

const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/employee/dashboard" replace />;
};

export const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<MainLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/employees" element={<EmployeesPage />} />
          <Route path="/admin/employees/:id" element={<EmployeeDetailPage />} />
          <Route path="/admin/departments" element={<DepartmentsPage />} />
          <Route path="/admin/performance" element={<PerformancePage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
        </Route>
      </Route>

      {/* Employee Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE', 'ADMIN']} />}>
        <Route element={<MainLayout />}>
          <Route path="/employee/dashboard" element={<EmployeePortalPage />} />
          <Route path="/employee/profile" element={<EmployeePortalPage />} />
        </Route>
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;

