import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

export const AdminRoute = () => {
  const { isSignedIn, loading, user } = useAuthContext();

  if (loading) return null;
  if (!isSignedIn) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/student" replace />;

  return <Outlet />;
};
