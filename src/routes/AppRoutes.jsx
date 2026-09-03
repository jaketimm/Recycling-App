import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { PlaceholderPage } from '../shared/components/PlaceholderPage';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { SignUpPage } from '../features/auth/pages/SignUpPage';
import { LandingPage } from '../features/landing/pages/LandingPage';
import { IdentifyPage } from '../features/identify/pages/IdentifyPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/landing" replace />} />

        {/* Public — available to anon and authenticated users alike */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/identify" element={<IdentifyPage />} />

        {/* Admin */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<PlaceholderPage title="Dashboard" description="User and DB management" />} />
          </Route>
        </Route>

        <Route path="*" element={<PlaceholderPage title="Not Found" description="No such page." />} />
      </Route>
    </Routes>
  );
}