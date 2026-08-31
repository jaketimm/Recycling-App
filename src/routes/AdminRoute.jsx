import { Navigate, Outlet } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { useProfile } from '../features/profile/hooks/useProfile';

export function AdminRoute() {
  const { isAdmin, isLoading } = useProfile();
  if (isLoading) return <Center h="50vh"><Loader /></Center>;
  if (!isAdmin) return <Navigate to="/identify" replace />;
  return <Outlet />;
}