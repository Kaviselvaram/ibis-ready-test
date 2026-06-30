import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

export const ProtectedRoute = () => {
  const { isSignedIn, loading } = useAuthContext();

  if (loading) return null;
  if (!isSignedIn) return <Navigate to="/login" replace />;

  return <Outlet />;
};
