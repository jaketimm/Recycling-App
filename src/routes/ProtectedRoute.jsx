import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { useAuth } from '../features/auth/hooks/useAuth';

export function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Center h="100vh"><Loader /></Center>;
  }
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}